package com.pdfumi.api.billing.web;

import com.pdfumi.api.billing.application.AdminManagementService;
import com.pdfumi.api.billing.application.AdminManagementService.GrantAccountRequest;
import com.pdfumi.api.billing.application.AdminManagementService.ProvisionAccountRequest;
import com.pdfumi.api.billing.application.PromoCodeService.CreatePromoRequest;
import com.pdfumi.api.billing.infrastructure.PromoCodeEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing/admin")
@Tag(name = "Admin Billing & Management")
public class AdminBillingController {

	private final AdminManagementService service;

	public AdminBillingController(AdminManagementService service) {
		this.service = service;
	}

	@GetMapping("/stats")
	@Operation(summary = "Admin KPIs and metrics (requires X-Admin-Key)")
	public Map<String, Object> getStats(
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.getStats(adminKey);
	}

	@GetMapping("/orders")
	@Operation(summary = "Admin view payment orders (requires X-Admin-Key)")
	public List<Map<String, Object>> getOrders(
			@RequestParam(value = "status", required = false) String status,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.getOrders(adminKey, status);
	}

	@PostMapping("/orders/{orderReference}/mark-paid")
	@Operation(summary = "Admin manually verify order as PAID (requires X-Admin-Key)")
	public Map<String, Object> markOrderPaid(
			@PathVariable String orderReference,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.markOrderPaid(adminKey, orderReference);
	}

	@GetMapping("/accounts")
	@Operation(summary = "Admin view registered user accounts (requires X-Admin-Key)")
	public List<Map<String, Object>> getAccounts(
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.getAccounts(adminKey);
	}

	@PostMapping("/accounts/provision")
	@Operation(summary = "Admin create / provision new custom account with immediate API key (requires X-Admin-Key)")
	public Map<String, Object> provisionAccount(
			@RequestBody ProvisionAccountRequest request,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.provisionAccount(adminKey, request);
	}

	@PostMapping("/accounts/{id}/grant")
	@Operation(summary = "Admin manual grant / extend plan to account (requires X-Admin-Key)")
	public Map<String, Object> grantAccount(
			@PathVariable UUID id,
			@RequestBody GrantAccountRequest request,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.grantAccount(adminKey, id, request);
	}

	@PostMapping("/cleanup-expired")
	@Operation(summary = "Admin run manual cleanup of overdue UNPAID orders (requires X-Admin-Key)")
	public Map<String, Object> cleanupExpired(
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.cleanupExpiredOrders(adminKey);
	}

	// --- Promo Code Endpoints ---

	@GetMapping("/promos")
	@Operation(summary = "Admin list all promo / voucher codes (requires X-Admin-Key)")
	public List<PromoCodeEntity> getPromos(
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.getPromoCodes(adminKey);
	}

	@PostMapping("/promos")
	@Operation(summary = "Admin create promo / voucher code (requires X-Admin-Key)")
	public PromoCodeEntity createPromo(
			@RequestBody CreatePromoRequest request,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.createPromoCode(adminKey, request);
	}

	@PutMapping("/promos/{code}/toggle")
	@Operation(summary = "Admin toggle active status of promo code (requires X-Admin-Key)")
	public PromoCodeEntity togglePromo(
			@PathVariable String code,
			@RequestParam("active") boolean active,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.togglePromoCode(adminKey, code, active);
	}

	@DeleteMapping("/promos/{code}")
	@Operation(summary = "Admin delete promo code (requires X-Admin-Key)")
	public Map<String, Object> deletePromo(
			@PathVariable String code,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		service.deletePromoCode(adminKey, code);
		return Map.of("success", true, "code", code, "message", "Kode promo " + code + " berhasil dihapus.");
	}
}
