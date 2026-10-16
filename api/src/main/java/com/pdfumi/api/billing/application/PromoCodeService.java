package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.PricingPlanEntity;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.billing.infrastructure.PromoCodeEntity;
import com.pdfumi.api.billing.infrastructure.PromoCodeRepository;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PromoCodeService {

	private final PromoCodeRepository promoCodeRepository;
	private final AccountService accountService;
	private final PricingPlanRepository pricingPlanRepository;
	private final PricingPlanService pricingPlanService;

	public PromoCodeService(
			PromoCodeRepository promoCodeRepository,
			AccountService accountService,
			PricingPlanRepository pricingPlanRepository,
			PricingPlanService pricingPlanService
	) {
		this.promoCodeRepository = promoCodeRepository;
		this.accountService = accountService;
		this.pricingPlanRepository = pricingPlanRepository;
		this.pricingPlanService = pricingPlanService;
	}

	@Transactional(readOnly = true)
	public PromoCodeEntity validatePromoCode(String rawCode, String targetPlan) {
		if (rawCode == null || rawCode.isBlank()) {
			throw new BadRequestException("Kode promo tidak boleh kosong.");
		}
		String code = rawCode.trim().toUpperCase();
		PromoCodeEntity promo = promoCodeRepository.findByCodeIgnoreCase(code)
				.orElseThrow(() -> new BadRequestException("Kode promo '" + code + "' tidak ditemukan atau tidak valid."));

		if (!promo.isActive()) {
			throw new BadRequestException("Kode promo '" + code + "' saat ini tidak aktif.");
		}
		if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(Instant.now())) {
			throw new BadRequestException("Kode promo '" + code + "' telah kedaluwarsa.");
		}
		if (promo.getMaxUses() > 0 && promo.getUsedCount() >= promo.getMaxUses()) {
			throw new BadRequestException("Kuota penggunaan kode promo '" + code + "' telah habis.");
		}
		if (targetPlan != null && !"ALL".equalsIgnoreCase(promo.getPlan()) && !promo.getPlan().equalsIgnoreCase(targetPlan)) {
			throw new BadRequestException("Kode promo ini khusus untuk paket " + promo.getPlan() + ".");
		}
		return promo;
	}

	@Transactional
	public Map<String, Object> checkPromo(String rawCode, String targetPlan) {
		PromoCodeEntity promo = validatePromoCode(rawCode, targetPlan);
		return Map.of(
				"code", promo.getCode(),
				"discountPercent", promo.getDiscountPercent(),
				"plan", promo.getPlan(),
				"isFree", promo.getDiscountPercent() == 100,
				"message", "Kode promo valid! Diskon " + promo.getDiscountPercent() + "% diterapkan."
		);
	}

	@Transactional
	public Map<String, Object> redeem100PercentFree(String rawCode, String email, String targetPlanStr) {
		PromoCodeEntity promo = validatePromoCode(rawCode, targetPlanStr);
		if (promo.getDiscountPercent() != 100) {
			throw new BadRequestException("Kode promo ini bukan kode 100% gratis. Silakan gunakan saat pembayaran.");
		}

		Plan plan;
		try {
			plan = Plan.valueOf(targetPlanStr.toUpperCase());
		} catch (Exception ex) {
			throw new BadRequestException("Plan '" + targetPlanStr + "' tidak valid.");
		}

		AccountEntity account = accountService.requireByEmail(email);
		account.setPlan(plan);
		account.setSubscriptionStatus("active");

		long days = pricingPlanRepository.findById(plan.name())
				.map(PricingPlanEntity::getDurationDays)
				.map(Long::valueOf)
				.orElseGet(() -> (plan == Plan.PASS) ? 7L : (plan == Plan.BUSINESS ? 365L : 30L));

		Instant now = Instant.now();
		Instant currentEnd = account.getCurrentPeriodEnd();
		Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
				? currentEnd.plus(days, ChronoUnit.DAYS)
				: now.plus(days, ChronoUnit.DAYS);
		account.setCurrentPeriodEnd(newEnd);
		accountService.accounts().save(account);

		// Increment usage
		promo.incrementUsedCount();
		promoCodeRepository.save(promo);

		Map<String, Object> resp = new HashMap<>();
		resp.put("success", true);
		resp.put("code", promo.getCode());
		resp.put("plan", plan.name());
		resp.put("email", account.getEmail());
		resp.put("currentPeriodEnd", newEnd.toString());
		resp.put("message", "Selamat! Kode promo 100% gratis berhasil digunakan. Paket " + plan.name() + " Anda telah aktif hingga " + newEnd.toString() + ".");
		return resp;
	}

	// --- Admin Endpoints ---

	@Transactional(readOnly = true)
	public List<PromoCodeEntity> getAllPromoCodes(String adminKey) {
		pricingPlanService.requireAdmin(adminKey);
		return promoCodeRepository.findAllByOrderByCreatedAtDesc();
	}

	@Transactional
	public PromoCodeEntity createPromoCode(String adminKey, CreatePromoRequest req) {
		pricingPlanService.requireAdmin(adminKey);

		if (req.code() == null || req.code().isBlank()) {
			throw new BadRequestException("Kode promo tidak boleh kosong.");
		}
		String cleanCode = req.code().trim().toUpperCase();
		if (promoCodeRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
			throw new BadRequestException("Kode promo '" + cleanCode + "' sudah ada.");
		}

		int discount = req.discountPercent() != null ? req.discountPercent() : 10;
		if (discount <= 0 || discount > 100) {
			throw new BadRequestException("Diskon harus antara 1% hingga 100%.");
		}

		String plan = (req.plan() != null && !req.plan().isBlank()) ? req.plan().trim().toUpperCase() : "ALL";
		int maxUses = (req.maxUses() != null && req.maxUses() > 0) ? req.maxUses() : 0;

		PromoCodeEntity entity = new PromoCodeEntity(
				cleanCode,
				discount,
				plan,
				maxUses,
				0,
				req.expiresAt(),
				true,
				Instant.now()
		);
		return promoCodeRepository.save(entity);
	}

	@Transactional
	public PromoCodeEntity togglePromoCode(String adminKey, String code, boolean active) {
		pricingPlanService.requireAdmin(adminKey);
		PromoCodeEntity promo = promoCodeRepository.findByCodeIgnoreCase(code.trim().toUpperCase())
				.orElseThrow(() -> new NotFoundException("Kode promo '" + code + "' tidak ditemukan."));
		promo.setActive(active);
		return promoCodeRepository.save(promo);
	}

	@Transactional
	public void deletePromoCode(String adminKey, String code) {
		pricingPlanService.requireAdmin(adminKey);
		PromoCodeEntity promo = promoCodeRepository.findByCodeIgnoreCase(code.trim().toUpperCase())
				.orElseThrow(() -> new NotFoundException("Kode promo '" + code + "' tidak ditemukan."));
		promoCodeRepository.delete(promo);
	}

	public record CreatePromoRequest(
			String code,
			Integer discountPercent,
			String plan,
			Integer maxUses,
			Instant expiresAt
	) {
	}
}
