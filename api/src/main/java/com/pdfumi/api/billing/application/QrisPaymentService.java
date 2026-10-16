package com.pdfumi.api.billing.application;

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

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
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

		// Sandbox / Simulator QRIS
		String qrString = "00020101021226540014ID.LINKAJA.WWW01189360091100222079035204581253033605802ID5910PDFUMI-"
				+ plan.name() + "6007JAKARTA62070703A016304"
				+ orderRef;
		String qrUrl = null;
		String checkoutUrl = null;

		// Generate QR Image data URL for immediate rendering in browser
		String qrDataUrl = renderQrDataUrl(qrString);

		PaymentOrderEntity entity = new PaymentOrderEntity(
				UUID.randomUUID(),
				account.getId(),
				orderRef,
				"SIMULATOR",
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
		resp.put("sandboxMode", true);
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
		markOrderPaid(orderReference);
		return Map.of("status", "PAID", "message", "Simulasi pembayaran QRIS berhasil diverifikasi.");
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
}
