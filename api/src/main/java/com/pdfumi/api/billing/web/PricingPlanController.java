package com.pdfumi.api.billing.web;

import com.pdfumi.api.billing.application.PricingPlanService;
import com.pdfumi.api.billing.application.PricingPlanService.PlanCreateRequest;
import com.pdfumi.api.billing.application.PricingPlanService.PlanUpdateRequest;
import com.pdfumi.api.billing.infrastructure.PricingPlanEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Pricing Plans")
public class PricingPlanController {

	private final PricingPlanService pricingPlanService;

	public PricingPlanController(PricingPlanService pricingPlanService) {
		this.pricingPlanService = pricingPlanService;
	}

	@GetMapping("/billing/plans")
	@Operation(summary = "Public list of active pricing plans from database")
	public List<PricingPlanEntity> getPublicPlans() {
		return pricingPlanService.getActivePlans();
	}

	@GetMapping("/billing/admin/plans")
	@Operation(summary = "Admin list all pricing plans (requires X-Admin-Key)")
	public List<PricingPlanEntity> getAdminPlans(
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return pricingPlanService.getAllPlans(adminKey);
	}

	@GetMapping("/billing/admin/plans/{id}")
	@Operation(summary = "Admin get single plan detail (requires X-Admin-Key)")
	public PricingPlanEntity getAdminPlanDetail(
			@PathVariable String id,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		pricingPlanService.requireAdmin(adminKey);
		return pricingPlanService.getPlanById(id);
	}

	@PostMapping("/billing/admin/plans")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Admin create a new pricing plan (requires X-Admin-Key)")
	public PricingPlanEntity createPlan(
			@RequestBody PlanCreateRequest request,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return pricingPlanService.createPlan(request, adminKey);
	}

	@PutMapping("/billing/admin/plans/{id}")
	@Operation(summary = "Admin update plan price, quotas, duration, badge, or status (requires X-Admin-Key)")
	public PricingPlanEntity updatePlan(
			@PathVariable String id,
			@RequestBody PlanUpdateRequest request,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return pricingPlanService.updatePlan(id, request, adminKey);
	}

	@DeleteMapping("/billing/admin/plans/{id}")
	@Operation(summary = "Admin delete a plan (requires X-Admin-Key)")
	public Map<String, Object> deletePlan(
			@PathVariable String id,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		pricingPlanService.deletePlan(id, adminKey);
		return Map.of("success", true, "message", "Paket '" + id + "' berhasil dihapus");
	}
}
