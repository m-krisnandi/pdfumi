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
import com.pdfumi.api.modules.certificate.infrastructure.ZxingQrCodeEncoder;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.shared.mail.TransactionalMailer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class QrisPaymentService {

	private static final Logger log = LoggerFactory.getLogger(QrisPaymentService.class);

	private final PaymentOrderRepository orderRepository;
	private final PricingPlanRepository pricingPlanRepository;
	private final AccountService accountService;
	private final PdfumiProperties properties;
	private final ZxingQrCodeEncoder qrCodeEncoder;
	private final TransactionalMailer mailer;
	private final PromoCodeRepository promoCodeRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final HttpClient httpClient;

	public QrisPaymentService(
			PaymentOrderRepository orderRepository,
			PricingPlanRepository pricingPlanRepository,
			AccountService accountService,
			PdfumiProperties properties,
			ZxingQrCodeEncoder qrCodeEncoder,
			TransactionalMailer mailer,
			PromoCodeRepository promoCodeRepository
	) {
		this.orderRepository = orderRepository;
		this.pricingPlanRepository = pricingPlanRepository;
		this.accountService = accountService;
		this.properties = properties;
		this.qrCodeEncoder = qrCodeEncoder;
		this.mailer = mailer;
		this.promoCodeRepository = promoCodeRepository;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();
	}

	@Transactional
	public Map<String, Object> createOrder(ClientContext client, String planRaw, String emailRaw, String locale) {
		return createOrder(client, planRaw, emailRaw, locale, null);
	}

	@Transactional
	public Map<String, Object> createOrder(ClientContext client, String planRaw, String emailRaw, String locale, String promoCode) {
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

		// Retrieve price & duration from dynamic DB if exists, otherwise fallback to properties
		Optional<PricingPlanEntity> dbPlanOpt = pricingPlanRepository.findById(plan.name());
		int amount;
		if (dbPlanOpt.isPresent() && dbPlanOpt.get().isActive()) {
			amount = dbPlanOpt.get().getPriceIdr();
		} else {
			amount = switch (plan) {
				case PASS -> properties.pricePassIdr();
				case PRO -> properties.priceProIdr();
				case BUSINESS -> properties.priceBusinessIdr();
				default -> properties.priceProIdr();
			};
		}

		String orderRef = "QRS-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
		Instant now = Instant.now();
		Instant expiresAt = now.plus(24, ChronoUnit.HOURS);

		// Handle Promo Code if present
		int discountPercent = 0;
		if (promoCode != null && !promoCode.isBlank()) {
			String cleanCode = promoCode.trim().toUpperCase();
			PromoCodeEntity promo = promoCodeRepository.findByCodeIgnoreCase(cleanCode)
					.orElseThrow(() -> new BadRequestException("Kode promo '" + cleanCode + "' tidak ditemukan."));

			if (!promo.isActive()) {
				throw new BadRequestException("Kode promo '" + cleanCode + "' saat ini tidak aktif.");
			}
			if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(now)) {
				throw new BadRequestException("Kode promo '" + cleanCode + "' telah kedaluwarsa.");
			}
			if (promo.getMaxUses() > 0 && promo.getUsedCount() >= promo.getMaxUses()) {
				throw new BadRequestException("Kuota kode promo '" + cleanCode + "' telah habis.");
			}
			if (!"ALL".equalsIgnoreCase(promo.getPlan()) && !promo.getPlan().equalsIgnoreCase(plan.name())) {
				throw new BadRequestException("Kode promo ini khusus untuk paket " + promo.getPlan() + ".");
			}

			discountPercent = promo.getDiscountPercent();
			promo.incrementUsedCount();
			promoCodeRepository.save(promo);

			// If 100% FREE: Activate plan immediately without hitting payment gateway
			if (discountPercent >= 100) {
				account.setPlan(plan);
				account.setSubscriptionStatus("active");

				long daysToAdd = dbPlanOpt
						.map(PricingPlanEntity::getDurationDays)
						.map(Long::valueOf)
						.orElseGet(() -> (plan == Plan.PASS) ? 7L : (plan == Plan.BUSINESS ? 365L : 30L));

				Instant currentEnd = account.getCurrentPeriodEnd();
				Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
						? currentEnd.plus(daysToAdd, ChronoUnit.DAYS)
						: now.plus(daysToAdd, ChronoUnit.DAYS);
				account.setCurrentPeriodEnd(newEnd);
				accountService.accounts().save(account);

				PaymentOrderEntity freeEntity = new PaymentOrderEntity(
						UUID.randomUUID(),
						account.getId(),
						orderRef,
						"PROMO_100_FREE",
						plan,
						plan == Plan.BUSINESS ? 12 : 1,
						0,
						"PAID",
						null,
						null,
						null,
						expiresAt,
						now
				);
				freeEntity.setPaidAt(now);
				orderRepository.save(freeEntity);

				Map<String, Object> resp = new HashMap<>();
				resp.put("orderReference", orderRef);
				resp.put("status", "PAID");
				resp.put("freePromoGranted", true);
				resp.put("discountPercent", 100);
				resp.put("plan", plan.name());
				resp.put("amount", 0);
				resp.put("amountFormatted", "Rp 0 (Gratis Promo)");
				resp.put("email", account.getEmail());
				if (newApiKey != null) {
					resp.put("apiKey", newApiKey);
					resp.put("hint", "Simpan API key ini sekarang - hanya ditampilkan sekali.");
				}
				return resp;
			} else {
				amount = (int) Math.round(amount * (100.0 - discountPercent) / 100.0);
			}
		}

		String qrString;
		String qrUrl = null;
		String checkoutUrl = null;

		boolean liveTripay = properties.tripayEnabled();
		if (liveTripay) {
			try {
				Map<String, String> tripayResult = callTripayCreate(orderRef, amount, plan, account, locale, expiresAt);
				qrString = tripayResult.get("qr_string");
				qrUrl = tripayResult.get("qr_url");
				checkoutUrl = tripayResult.get("checkout_url");
			} catch (Exception ex) {
				log.error("Tripay transaction create error", ex);
				throw new BadRequestException("Gagal menghubungi gateway pembayaran Tripay: " + ex.getMessage());
			}
		} else {
			// Sandbox / Simulator QRIS
			qrString = "00020101021226540014ID.LINKAJA.WWW01189360091100222079035204581253033605802ID5910PDFUMI-"
					+ plan.name() + "6007JAKARTA62070703A016304"
					+ orderRef;
		}

		// Generate QR Image data URL for immediate rendering in browser
		String qrDataUrl = renderQrDataUrl(qrString != null && !qrString.isBlank() ? qrString : orderRef);

		PaymentOrderEntity entity = new PaymentOrderEntity(
				UUID.randomUUID(),
				account.getId(),
				orderRef,
				liveTripay ? "TRIPAY" : "SIMULATOR",
				plan,
				plan == Plan.BUSINESS ? 12 : 1,
				amount,
				"UNPAID",
				qrString,
				qrUrl,
				checkoutUrl,
				expiresAt,
				now
		);
		orderRepository.save(entity);

		Map<String, Object> resp = new HashMap<>();
		resp.put("orderReference", orderRef);
		resp.put("plan", plan.name());
		resp.put("amount", amount);
		resp.put("amountFormatted", "Rp " + String.format("%,d", amount).replace(',', '.'));
		resp.put("discountPercent", discountPercent);
		resp.put("qrString", qrString);
		resp.put("qrDataUrl", qrDataUrl);
		resp.put("qrUrl", qrUrl);
		resp.put("checkoutUrl", checkoutUrl);
		resp.put("expiresAt", expiresAt.toString());
		resp.put("sandboxMode", !liveTripay);
		resp.put("email", account.getEmail());
		if (newApiKey != null) {
			resp.put("apiKey", newApiKey);
			resp.put("hint", "Simpan API key ini sekarang - hanya ditampilkan sekali.");
		}
		return resp;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> checkStatus(String orderReference) {
		PaymentOrderEntity order = orderRepository.findByOrderReference(orderReference)
				.orElseThrow(() -> new NotFoundException("Order tidak ditemukan"));

		Map<String, Object> res = new HashMap<>();
		res.put("orderReference", order.getOrderReference());
		res.put("status", order.getStatus());
		res.put("plan", order.getPlan().name());
		res.put("amount", order.getAmount());
		res.put("paidAt", order.getPaidAt() != null ? order.getPaidAt().toString() : null);
		res.put("expiresAt", order.getExpiresAt().toString());
		return res;
	}

	@Transactional
	public Map<String, Object> simulatePayment(String orderReference) {
		if (properties.tripayEnabled() && "production".equalsIgnoreCase(properties.tripayMode())) {
			throw new BadRequestException("Simulasi pembayaran hanya aktif di mode Sandbox/Development.");
		}
		markOrderPaid(orderReference);
		return Map.of("status", "PAID", "message", "Simulasi pembayaran QRIS berhasil diverifikasi.");
	}

	@Transactional
	public void handleTripayWebhook(String payload, String signatureHeader) {
		if (!properties.tripayEnabled()) {
			throw new BadRequestException("Tripay is not enabled");
		}
		String calculatedSignature = hmacSha256(payload, properties.tripayPrivateKey());
		if (!calculatedSignature.equalsIgnoreCase(signatureHeader)) {
			log.warn("Tripay webhook signature mismatch. Received: {}, Expected: {}", signatureHeader, calculatedSignature);
			throw new BadRequestException("Invalid Tripay webhook signature");
		}

		try {
			JsonNode root = objectMapper.readTree(payload);
			String merchantRef = root.path("merchant_ref").asText();
			String status = root.path("status").asText();

			if ("PAID".equalsIgnoreCase(status)) {
				markOrderPaid(merchantRef);
			} else if ("EXPIRED".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status)) {
				orderRepository.findByOrderReference(merchantRef).ifPresent(order -> {
					order.setStatus(status.toUpperCase());
					orderRepository.save(order);
				});
			}
		} catch (Exception ex) {
			log.error("Failed to parse Tripay webhook payload", ex);
			throw new BadRequestException("Invalid payload");
		}
	}

	@Transactional
	public void markOrderPaid(String orderReference) {
		PaymentOrderEntity order = orderRepository.findByOrderReference(orderReference)
				.orElseThrow(() -> new NotFoundException("Order " + orderReference + " tidak ditemukan"));

		if ("PAID".equalsIgnoreCase(order.getStatus())) {
			return; // Idempotent
		}

		Instant now = Instant.now();
		order.setStatus("PAID");
		order.setPaidAt(now);
		orderRepository.save(order);

		AccountEntity account = accountService.requireAccount(order.getAccountId());
		account.setPlan(order.getPlan());
		account.setSubscriptionStatus("active");

		// Duration: read dynamic days from DB if available, fallback to plan default
		long daysToAdd = pricingPlanRepository.findById(order.getPlan().name())
				.map(PricingPlanEntity::getDurationDays)
				.map(Long::valueOf)
				.orElseGet(() -> (order.getPlan() == Plan.PASS) ? 7L : (order.getPlan() == Plan.BUSINESS ? 365L : 30L));

		Instant currentEnd = account.getCurrentPeriodEnd();
		Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
				? currentEnd.plus(daysToAdd, ChronoUnit.DAYS)
				: now.plus(daysToAdd, ChronoUnit.DAYS);
		account.setCurrentPeriodEnd(newEnd);
		accountService.accounts().save(account);

		log.info("QRIS order {} marked PAID for account {}. Plan: {}, PeriodEnd: {}",
				orderReference, account.getEmail(), order.getPlan(), newEnd);

		// Send email notification
		try {
			String subject = "Pembayaran QRIS Berhasil - Paket " + order.getPlan().name() + " Pdfumi Aktif";
			String body = "Halo,\n\nTerima kasih! Pembayaran QRIS Anda untuk paket "
					+ order.getPlan().name() + " telah kami terima.\n\n"
					+ "Nomor Referensi: " + order.getOrderReference() + "\n"
					+ "Total Pembayaran: Rp " + String.format("%,d", order.getAmount()).replace(',', '.') + "\n"
					+ "Masa Aktif Hingga: " + newEnd.toString() + "\n\n"
					+ "Buka dashboard Anda: " + properties.publicWebBaseUrl() + "/id/account\n\n"
					+ "Salam,\nTim Pdfumi";
			mailer.sendText(account.getEmail(), subject, body);
		} catch (Exception ex) {
			log.warn("Failed to send payment receipt email: {}", ex.getMessage());
		}
	}

	private Map<String, String> callTripayCreate(
			String merchantRef,
			int amount,
			Plan plan,
			AccountEntity account,
			String locale,
			Instant expiresAt
	) throws Exception {
		String baseUrl = "production".equalsIgnoreCase(properties.tripayMode())
				? "https://tripay.co.id/api"
				: "https://tripay.co.id/api-sandbox";

		long expiryEpoch = expiresAt.getEpochSecond();
		String signaturePayload = properties.tripayMerchantCode() + merchantRef + amount;
		String signature = hmacSha256(signaturePayload, properties.tripayPrivateKey());

		Map<String, Object> reqBody = new HashMap<>();
		reqBody.put("method", "QRIS");
		reqBody.put("merchant_ref", merchantRef);
		reqBody.put("amount", amount);
		reqBody.put("customer_name", account.getEmail().split("@")[0]);
		reqBody.put("customer_email", account.getEmail());
		reqBody.put("order_items", new Object[]{
				Map.of(
						"sku", plan.name(),
						"name", "Pdfumi Subscription " + plan.name(),
						"price", amount,
						"quantity", 1
				)
		});
		reqBody.put("callback_url", properties.publicApiBaseUrl() + "/api/v1/billing/qris/webhook");
		reqBody.put("return_url", properties.publicWebBaseUrl() + "/" + (locale != null ? locale : "id") + "/account?checkout=qris-success");
		reqBody.put("expired_time", expiryEpoch);
		reqBody.put("signature", signature);

		String json = objectMapper.writeValueAsString(reqBody);

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(baseUrl + "/transaction/create"))
				.header("Authorization", "Bearer " + properties.tripayApiKey())
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(json))
				.build();

		HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() >= 400) {
			throw new BadRequestException("Tripay API error (" + response.statusCode() + "): " + response.body());
		}

		JsonNode root = objectMapper.readTree(response.body());
		if (!root.path("success").asBoolean(false)) {
			throw new BadRequestException("Tripay gagal: " + root.path("message").asText("Unknown error"));
		}

		JsonNode data = root.path("data");
		Map<String, String> result = new HashMap<>();
		result.put("qr_string", data.path("qr_string").asText());
		result.put("qr_url", data.path("qr_url").asText());
		result.put("checkoutUrl", data.path("checkout_url").asText());
		return result;
	}

	private String renderQrDataUrl(String text) {
		try {
			BufferedImage image = qrCodeEncoder.encode(text, 300);
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			javax.imageio.ImageIO.write(image, "PNG", baos);
			return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
		} catch (Exception ex) {
			log.warn("Failed to generate QR data URL: {}", ex.getMessage());
			return "";
		}
	}

	private String hmacSha256(String data, String key) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
			mac.init(secretKeySpec);
			byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException | InvalidKeyException ex) {
			throw new IllegalStateException("Failed to calculate HMAC-SHA256", ex);
		}
	}
}
