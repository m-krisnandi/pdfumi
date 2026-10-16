package com.pdfumi.api.billing.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.PaymentOrderEntity;
import com.pdfumi.api.billing.infrastructure.PaymentOrderRepository;
import com.pdfumi.api.billing.infrastructure.PricingPlanEntity;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.billing.infrastructure.PromoCodeEntity;
import com.pdfumi.api.billing.infrastructure.PromoCodeRepository;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.mail.TransactionalMailer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MidtransPaymentService {

	private static final Logger log = LoggerFactory.getLogger(MidtransPaymentService.class);

	private final PaymentOrderRepository orderRepository;
	private final PricingPlanRepository pricingPlanRepository;
	private final AccountService accountService;
	private final PdfumiProperties properties;
	private final TransactionalMailer mailer;
	private final PromoCodeRepository promoCodeRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final HttpClient httpClient;

	public MidtransPaymentService(
			PaymentOrderRepository orderRepository,
			PricingPlanRepository pricingPlanRepository,
			AccountService accountService,
			PdfumiProperties properties,
			TransactionalMailer mailer,
			PromoCodeRepository promoCodeRepository
	) {
		this.orderRepository = orderRepository;
		this.pricingPlanRepository = pricingPlanRepository;
		this.accountService = accountService;
		this.properties = properties;
		this.mailer = mailer;
		this.promoCodeRepository = promoCodeRepository;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();
	}

	@Transactional
	public Map<String, Object> createSnapTransaction(
			ClientContext client,
			String planRaw,
			String emailRaw,
			String locale,
			String promoCode
	) {
		if (!properties.midtransEnabled()) {
			throw new BadRequestException("Midtrans payment is not configured");
		}

		Plan plan = Plan.fromName(planRaw);
		if (plan == Plan.FREE) {
			throw new BadRequestException("Pilih paket PASS, PRO, atau BUSINESS untuk upgrade");
		}

		AccountEntity account;
		String newApiKey = null;
		if (client.isAuthenticated()) {
			account = accountService.requireAccount(client.accountId());
		} else {
			AccountService.EnsureAccount ensured = accountService.ensureAccount(emailRaw);
			account = ensured.account();
			newApiKey = ensured.newApiKey();
		}

		Optional<PricingPlanEntity> dbPlanOpt = pricingPlanRepository.findById(plan.name());
		int amount;
		if (dbPlanOpt.isPresent() && dbPlanOpt.get().isActive()) {
			amount = dbPlanOpt.get().getPriceIdr();
		} else {
			amount = switch (plan) {
				case PASS -> properties.pricePassIdr();
				case PRO -> properties.priceProIdr();
				case BUSINESS -> properties.priceBusinessIdr();
				default -> 29000;
			};
		}

		Instant now = Instant.now();
		boolean freePromoGranted = false;
		if (promoCode != null && !promoCode.isBlank()) {
			String cleanCode = promoCode.trim().toUpperCase();
			Optional<PromoCodeEntity> promoOpt = promoCodeRepository.findByCodeIgnoreCase(cleanCode);
			if (promoOpt.isPresent()) {
				PromoCodeEntity promo = promoOpt.get();
				if (promo.isActive() && (promo.getExpiresAt() == null || !promo.getExpiresAt().isBefore(now))) {
					if (promo.getMaxUses() <= 0 || promo.getUsedCount() < promo.getMaxUses()) {
						if (promo.getDiscountPercent() >= 100) {
							freePromoGranted = true;
							amount = 0;
						} else {
							amount = (int) Math.round(amount * (100.0 - promo.getDiscountPercent()) / 100.0);
						}
						promo.incrementUsedCount();
						promoCodeRepository.save(promo);
					}
				}
			}
		}

		if (freePromoGranted) {
			long daysToAdd = dbPlanOpt
					.map(PricingPlanEntity::getDurationDays)
					.map(Long::valueOf)
					.orElseGet(() -> (plan == Plan.PASS) ? 7L : (plan == Plan.BUSINESS ? 365L : 30L));

			Instant currentEnd = account.getCurrentPeriodEnd();
			Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
					? currentEnd.plus(daysToAdd, ChronoUnit.DAYS)
					: now.plus(daysToAdd, ChronoUnit.DAYS);

			account.setPlan(plan);
			account.setSubscriptionStatus("active");
			account.setCurrentPeriodEnd(newEnd);
			accountService.accounts().save(account);

			Map<String, Object> freeResult = new HashMap<>();
			freeResult.put("freePromoGranted", true);
			freeResult.put("plan", plan.name());
			freeResult.put("amount", 0);
			if (newApiKey != null) freeResult.put("apiKey", newApiKey);
			return freeResult;
		}

		String orderRef = "PDFUMI-M-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
		int durationMonths = plan == Plan.PASS ? 0 : (plan == Plan.BUSINESS ? 12 : 1);
		Instant expiresAt = now.plus(Duration.ofHours(24));

		Map<String, String> midtransResp = callMidtransSnap(orderRef, amount, plan, account.getEmail(), locale);

		String snapToken = midtransResp.get("token");
		String redirectUrl = midtransResp.get("redirect_url");

		PaymentOrderEntity order = new PaymentOrderEntity(
				UUID.randomUUID(),
				account.getId(),
				orderRef,
				"MIDTRANS",
				plan,
				durationMonths,
				amount,
				"PENDING",
				null,
				null,
				redirectUrl,
				expiresAt,
				now
		);
		orderRepository.save(order);

		Map<String, Object> result = new HashMap<>();
		result.put("orderReference", orderRef);
		result.put("token", snapToken);
		result.put("checkoutUrl", redirectUrl);
		result.put("amount", amount);
		result.put("plan", plan.name());
		if (newApiKey != null) {
			result.put("apiKey", newApiKey);
		}
		return result;
	}

	@Transactional
	public Map<String, Object> handleMidtransWebhook(Map<String, Object> payload) {
		String orderId = String.valueOf(payload.getOrDefault("order_id", ""));
		String statusCode = String.valueOf(payload.getOrDefault("status_code", ""));
		String grossAmount = String.valueOf(payload.getOrDefault("gross_amount", ""));
		String signatureKey = String.valueOf(payload.getOrDefault("signature_key", ""));
		String transactionStatus = String.valueOf(payload.getOrDefault("transaction_status", ""));
		String fraudStatus = String.valueOf(payload.getOrDefault("fraud_status", ""));

		if (orderId.isBlank() || signatureKey.isBlank()) {
			throw new BadRequestException("Missing required Midtrans webhook parameters");
		}

		// Verify SHA-512 signature: SHA512(order_id + status_code + gross_amount + ServerKey)
		String calculatedSignature = sha512(orderId + statusCode + grossAmount + properties.midtransServerKey());
		if (!calculatedSignature.equalsIgnoreCase(signatureKey)) {
			log.warn("Midtrans signature mismatch for order {}. Expected: {}, Received: {}",
					orderId, calculatedSignature, signatureKey);
			throw new BadRequestException("Invalid Midtrans signature");
		}

		Optional<PaymentOrderEntity> orderOpt = orderRepository.findByOrderReference(orderId);
		if (orderOpt.isEmpty()) {
			log.warn("Midtrans webhook received for unknown order: {}", orderId);
			return Map.of("status", "ignored", "reason", "order_not_found");
		}

		PaymentOrderEntity order = orderOpt.get();
		if ("PAID".equals(order.getStatus())) {
			return Map.of("status", "already_paid");
		}

		if ("settlement".equalsIgnoreCase(transactionStatus)
				|| ("capture".equalsIgnoreCase(transactionStatus) && "accept".equalsIgnoreCase(fraudStatus))) {
			order.setStatus("PAID");
			order.setPaidAt(Instant.now());
			orderRepository.save(order);

			AccountEntity account = accountService.requireAccount(order.getAccountId());
			long daysToAdd = order.getPlan() == Plan.PASS ? 7L : (order.getPlan() == Plan.BUSINESS ? 365L : 30L);
			Instant currentEnd = account.getCurrentPeriodEnd();
			Instant now = Instant.now();
			Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
					? currentEnd.plus(daysToAdd, ChronoUnit.DAYS)
					: now.plus(daysToAdd, ChronoUnit.DAYS);

			account.setPlan(order.getPlan());
			account.setSubscriptionStatus("active");
			account.setCurrentPeriodEnd(newEnd);
			accountService.accounts().save(account);

			log.info("Midtrans order {} marked PAID for account {}. Plan: {}, PeriodEnd: {}",
					orderId, account.getEmail(), order.getPlan(), newEnd);

			try {
				String subject = "Pembayaran Midtrans Berhasil - Paket " + order.getPlan().name() + " Pdfumi Aktif";
				String body = "Halo,\n\nTerima kasih! Pembayaran Anda untuk paket "
						+ order.getPlan().name() + " Pdfumi telah berhasil diverifikasi via Midtrans.\n"
						+ "Masa Aktif Hingga: " + newEnd + ".\n\nSalam,\nTim Pdfumi";
				mailer.sendText(account.getEmail(), subject, body);
			} catch (Exception ex) {
				log.warn("Failed to send Midtrans confirmation email to {}", account.getEmail(), ex);
			}

			return Map.of("status", "ok", "message", "Payment settlement confirmed");
		} else if ("cancel".equalsIgnoreCase(transactionStatus)
				|| "deny".equalsIgnoreCase(transactionStatus)
				|| "expire".equalsIgnoreCase(transactionStatus)) {
			order.setStatus("EXPIRED");
			orderRepository.save(order);
			return Map.of("status", "cancelled", "transactionStatus", transactionStatus);
		}

		return Map.of("status", "pending", "transactionStatus", transactionStatus);
	}

	private Map<String, String> callMidtransSnap(
			String orderId,
			int amount,
			Plan plan,
			String email,
			String locale
	) {
		try {
			Map<String, Object> req = new HashMap<>();
			Map<String, Object> txDetails = new HashMap<>();
			txDetails.put("order_id", orderId);
			txDetails.put("gross_amount", amount);
			req.put("transaction_details", txDetails);

			Map<String, Object> custDetails = new HashMap<>();
			custDetails.put("email", email);
			req.put("customer_details", custDetails);

			Map<String, Object> item = new HashMap<>();
			item.put("id", plan.name());
			item.put("price", amount);
			item.put("quantity", 1);
			item.put("name", "Pdfumi " + plan.name());
			req.put("item_details", List.of(item));

			Map<String, Object> callbacks = new HashMap<>();
			callbacks.put("finish", properties.publicWebBaseUrl() + "/" + (locale != null ? locale : "id") + "/account?checkout=midtrans-success");
			req.put("callbacks", callbacks);

			String authHeader = "Basic " + Base64.getEncoder().encodeToString(
					(properties.midtransServerKey() + ":").getBytes(StandardCharsets.UTF_8)
			);

			String jsonBody = objectMapper.writeValueAsString(req);

			HttpRequest httpRequest = HttpRequest.newBuilder()
					.uri(URI.create(properties.midtransSnapUrl()))
					.header("Accept", "application/json")
					.header("Content-Type", "application/json")
					.header("Authorization", authHeader)
					.POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
					.build();

			HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

			if (response.statusCode() >= 400) {
				log.error("Midtrans Snap API error: HTTP {} {}", response.statusCode(), response.body());
				throw new BadRequestException("Gagal menghubungi gateway Midtrans (" + response.statusCode() + ")");
			}

			JsonNode root = objectMapper.readTree(response.body());
			String token = root.path("token").asText();
			String redirectUrl = root.path("redirect_url").asText();

			Map<String, String> out = new HashMap<>();
			out.put("token", token);
			out.put("redirect_url", redirectUrl);
			return out;
		} catch (BadRequestException e) {
			throw e;
		} catch (Exception e) {
			log.error("Failed to call Midtrans Snap API", e);
			throw new BadRequestException("Gagal membuat transaksi Midtrans: " + e.getMessage());
		}
	}

	private static String sha512(String input) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-512");
			byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("SHA-512 not available", e);
		}
	}
}
