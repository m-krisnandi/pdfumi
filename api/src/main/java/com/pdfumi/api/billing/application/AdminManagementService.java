package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.application.PromoCodeService.CreatePromoRequest;
import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.AccountRepository;
import com.pdfumi.api.billing.infrastructure.ApiKeyRepository;
import com.pdfumi.api.billing.infrastructure.PaymentOrderEntity;
import com.pdfumi.api.billing.infrastructure.PaymentOrderRepository;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.billing.infrastructure.PromoCodeEntity;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminManagementService {

	private final AccountRepository accountRepository;
	private final PaymentOrderRepository paymentOrderRepository;
	private final ApiKeyRepository apiKeyRepository;
	private final PricingPlanRepository pricingPlanRepository;
	private final PricingPlanService pricingPlanService;
	private final QrisPaymentService qrisPaymentService;
	private final AccountService accountService;
	private final PromoCodeService promoCodeService;

	public AdminManagementService(
			AccountRepository accountRepository,
			PaymentOrderRepository paymentOrderRepository,
			ApiKeyRepository apiKeyRepository,
			PricingPlanRepository pricingPlanRepository,
			PricingPlanService pricingPlanService,
			QrisPaymentService qrisPaymentService,
			AccountService accountService,
			PromoCodeService promoCodeService
	) {
		this.accountRepository = accountRepository;
		this.paymentOrderRepository = paymentOrderRepository;
		this.apiKeyRepository = apiKeyRepository;
		this.pricingPlanRepository = pricingPlanRepository;
		this.pricingPlanService = pricingPlanService;
		this.qrisPaymentService = qrisPaymentService;
		this.accountService = accountService;
		this.promoCodeService = promoCodeService;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> getStats(String adminKey) {
		pricingPlanService.requireAdmin(adminKey);

		long totalAccounts = accountRepository.count();
		long proAccounts = accountRepository.countByPlan(Plan.PRO);
		long businessAccounts = accountRepository.countByPlan(Plan.BUSINESS);
		long unlimitedAccounts = accountRepository.countByPlan(Plan.UNLIMITED);
		long freeAccounts = accountRepository.countByPlan(Plan.FREE);

		long totalOrders = paymentOrderRepository.count();
		long paidOrders = paymentOrderRepository.countByStatus("PAID");
		long unpaidOrders = paymentOrderRepository.countByStatus("UNPAID");
		long expiredOrders = paymentOrderRepository.countByStatus("EXPIRED");
		long totalRevenueIdr = paymentOrderRepository.totalPaidRevenue();

		Map<String, Object> stats = new HashMap<>();
		stats.put("totalAccounts", totalAccounts);
		stats.put("proAccounts", proAccounts);
		stats.put("businessAccounts", businessAccounts);
		stats.put("unlimitedAccounts", unlimitedAccounts);
		stats.put("freeAccounts", freeAccounts);
		stats.put("totalOrders", totalOrders);
		stats.put("paidOrders", paidOrders);
		stats.put("unpaidOrders", unpaidOrders);
		stats.put("expiredOrders", expiredOrders);
		stats.put("totalRevenueIdr", totalRevenueIdr);
		stats.put("totalRevenueIdrFormatted", "Rp " + String.format("%,d", totalRevenueIdr).replace(',', '.'));
		return stats;
	}

	@Transactional(readOnly = true)
	public List<Map<String, Object>> getOrders(String adminKey, String statusFilter) {
		pricingPlanService.requireAdmin(adminKey);

		List<PaymentOrderEntity> orders;
		if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
			orders = paymentOrderRepository.findByStatusOrderByCreatedAtDesc(statusFilter.toUpperCase());
		} else {
			orders = paymentOrderRepository.findAllByOrderByCreatedAtDesc();
		}

		// Cache email lookups to avoid n+1 overhead
		Map<UUID, String> emailCache = new HashMap<>();

		List<Map<String, Object>> result = new ArrayList<>();
		for (PaymentOrderEntity order : orders) {
			String email = emailCache.computeIfAbsent(order.getAccountId(), id ->
					accountRepository.findById(id).map(AccountEntity::getEmail).orElse("Unknown")
			);

			Map<String, Object> map = new HashMap<>();
			map.put("id", order.getId().toString());
			map.put("orderReference", order.getOrderReference());
			map.put("accountId", order.getAccountId().toString());
			map.put("accountEmail", email);
			map.put("gateway", order.getGateway());
			map.put("plan", order.getPlan().name());
			map.put("durationMonths", order.getDurationMonths());
			map.put("amount", order.getAmount());
			map.put("amountFormatted", "Rp " + String.format("%,d", order.getAmount()).replace(',', '.'));
			map.put("status", order.getStatus());
			map.put("qrUrl", order.getQrUrl());
			map.put("checkoutUrl", order.getCheckoutUrl());
			map.put("paidAt", order.getPaidAt() != null ? order.getPaidAt().toString() : null);
			map.put("expiresAt", order.getExpiresAt().toString());
			map.put("createdAt", order.getCreatedAt().toString());
			result.add(map);
		}

		return result;
	}

	@Transactional
	public Map<String, Object> markOrderPaid(String adminKey, String orderReference) {
		pricingPlanService.requireAdmin(adminKey);
		qrisPaymentService.markOrderPaid(orderReference);
		return Map.of(
				"status", "PAID",
				"orderReference", orderReference,
				"message", "Order pembayaran " + orderReference + " berhasil diverifikasi dan hak akses akun telah diaktifkan."
		);
	}

	@Transactional(readOnly = true)
	public List<Map<String, Object>> getAccounts(String adminKey) {
		pricingPlanService.requireAdmin(adminKey);

		List<AccountEntity> accounts = accountRepository.findAllByOrderByCreatedAtDesc();
		List<Map<String, Object>> result = new ArrayList<>();

		for (AccountEntity acc : accounts) {
			long keyCount = apiKeyRepository.countByAccountIdAndRevokedAtIsNull(acc.getId());

			Map<String, Object> map = new HashMap<>();
			map.put("id", acc.getId().toString());
			map.put("email", acc.getEmail());
			map.put("plan", acc.getPlan() != null ? acc.getPlan().name() : "FREE");
			map.put("subscriptionStatus", acc.getSubscriptionStatus() != null ? acc.getSubscriptionStatus() : "inactive");
			map.put("currentPeriodEnd", acc.getCurrentPeriodEnd() != null ? acc.getCurrentPeriodEnd().toString() : null);
			map.put("activeKeysCount", keyCount);
			map.put("createdAt", acc.getCreatedAt().toString());
			map.put("updatedAt", acc.getUpdatedAt().toString());
			result.add(map);
		}

		return result;
	}

	@Transactional
	public Map<String, Object> provisionAccount(String adminKey, ProvisionAccountRequest request) {
		pricingPlanService.requireAdmin(adminKey);

		if (request.email() == null || request.email().isBlank()) {
			throw new BadRequestException("Email akun wajib diisi.");
		}

		Plan targetPlan;
		try {
			targetPlan = Plan.valueOf(request.plan().toUpperCase());
		} catch (Exception ex) {
			throw new BadRequestException("Plan '" + request.plan() + "' tidak valid (pilihan: FREE, PASS, PRO, BUSINESS, UNLIMITED)");
		}

		boolean lifetime = Boolean.TRUE.equals(request.lifetime()) || targetPlan == Plan.UNLIMITED;
		int days = request.days() != null ? request.days() : 30;

		Map<String, Object> provisioned = accountService.provisionAccount(request.email(), targetPlan, days, lifetime);
		provisioned.put("message", "Akun khusus untuk " + request.email() + " (" + targetPlan.name() + (lifetime ? " - Seumur Hidup" : " - " + days + " Hari") + ") berhasil dibuat.");
		return provisioned;
	}

	@Transactional
	public Map<String, Object> grantAccount(String adminKey, UUID accountId, GrantAccountRequest request) {
		pricingPlanService.requireAdmin(adminKey);

		AccountEntity account = accountRepository.findById(accountId)
				.orElseThrow(() -> new NotFoundException("Akun tidak ditemukan"));

		Plan targetPlan;
		try {
			targetPlan = Plan.valueOf(request.plan().toUpperCase());
		} catch (Exception ex) {
			throw new BadRequestException("Plan '" + request.plan() + "' tidak valid (pilihan: FREE, PRO, BUSINESS, PASS, UNLIMITED)");
		}

		account.setPlan(targetPlan);

		boolean isLifetime = Boolean.TRUE.equals(request.lifetime()) || targetPlan == Plan.UNLIMITED;
		if (isLifetime) {
			account.setSubscriptionStatus("lifetime");
			account.setCurrentPeriodEnd(Instant.now().plus(36500, ChronoUnit.DAYS));
		} else if (targetPlan != Plan.FREE) {
			account.setSubscriptionStatus("active");
			int days = request.days() != null ? request.days() : 30;
			Instant now = Instant.now();
			Instant currentEnd = account.getCurrentPeriodEnd();
			Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
					? currentEnd.plus(days, ChronoUnit.DAYS)
					: now.plus(days, ChronoUnit.DAYS);
			account.setCurrentPeriodEnd(newEnd);
		} else {
			account.setCurrentPeriodEnd(null);
			account.setSubscriptionStatus("inactive");
		}

		accountRepository.save(account);

		Map<String, Object> resp = new HashMap<>();
		resp.put("id", account.getId().toString());
		resp.put("email", account.getEmail());
		resp.put("plan", account.getPlan().name());
		resp.put("subscriptionStatus", account.getSubscriptionStatus());
		resp.put("currentPeriodEnd", account.getCurrentPeriodEnd() != null ? account.getCurrentPeriodEnd().toString() : null);
		resp.put("message", "Akun " + account.getEmail() + " berhasil di-upgrade ke paket " + targetPlan.name() + ".");
		return resp;
	}

	@Transactional
	public Map<String, Object> cleanupExpiredOrders(String adminKey) {
		pricingPlanService.requireAdmin(adminKey);
		int count = paymentOrderRepository.expireOverdueOrders(Instant.now());
		return Map.of("expiredCount", count, "message", count + " order kedaluwarsa berhasil diubah ke status EXPIRED.");
	}

	// --- Promo Code Delegates ---

	public List<PromoCodeEntity> getPromoCodes(String adminKey) {
		return promoCodeService.getAllPromoCodes(adminKey);
	}

	public PromoCodeEntity createPromoCode(String adminKey, CreatePromoRequest req) {
		return promoCodeService.createPromoCode(adminKey, req);
	}

	public PromoCodeEntity togglePromoCode(String adminKey, String code, boolean active) {
		return promoCodeService.togglePromoCode(adminKey, code, active);
	}

	public void deletePromoCode(String adminKey, String code) {
		promoCodeService.deletePromoCode(adminKey, code);
	}

	public record GrantAccountRequest(
			String plan,
			Integer days,
			Boolean lifetime
	) {
	}

	public record ProvisionAccountRequest(
			String email,
			String plan,
			Integer days,
			Boolean lifetime
	) {
	}
}
