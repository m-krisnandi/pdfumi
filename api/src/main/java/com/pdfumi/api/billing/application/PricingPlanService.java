package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.infrastructure.PricingPlanEntity;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.ForbiddenException;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.config.PdfumiProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class PricingPlanService {

	private final PricingPlanRepository repository;
	private final PdfumiProperties properties;

	public PricingPlanService(PricingPlanRepository repository, PdfumiProperties properties) {
		this.repository = repository;
		this.properties = properties;
	}

	public List<PricingPlanEntity> getActivePlans() {
		return repository.findByActiveTrueOrderByPriceIdrAsc();
	}

	public List<PricingPlanEntity> getAllPlans(String adminKey) {
		requireAdmin(adminKey);
		return repository.findAllByOrderByPriceIdrAsc();
	}

	public PricingPlanEntity getPlanById(String id) {
		return repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Paket '" + id + "' tidak ditemukan"));
	}

	public Optional<PricingPlanEntity> findPlanById(String id) {
		return repository.findById(id);
	}

	@Transactional
	public PricingPlanEntity updatePlan(String id, PlanUpdateRequest req, String adminKey) {
		requireAdmin(adminKey);
		PricingPlanEntity plan = repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Paket '" + id + "' tidak ditemukan"));

		if (req.name() != null && !req.name().isBlank()) {
			plan.setName(req.name());
		}
		if (req.priceIdr() != null) {
			if (req.priceIdr() < 0) throw new BadRequestException("Harga IDR tidak boleh negatif");
			plan.setPriceIdr(req.priceIdr());
		}
		if (req.priceUsd() != null) {
			if (req.priceUsd() < 0) throw new BadRequestException("Harga USD tidak boleh negatif");
			plan.setPriceUsd(req.priceUsd());
		}
		if (req.durationDays() != null) {
			if (req.durationDays() <= 0) throw new BadRequestException("Durasi hari harus > 0");
			plan.setDurationDays(req.durationDays());
		}
		if (req.monthlyDocumentLimit() != null) {
			plan.setMonthlyDocumentLimit(req.monthlyDocumentLimit());
		}
		if (req.certificateMaxRecipients() != null) {
			plan.setCertificateMaxRecipients(req.certificateMaxRecipients());
		}
		if (req.maxApiKeys() != null) {
			plan.setMaxApiKeys(req.maxApiKeys());
		}
		if (req.brandFooter() != null) {
			plan.setBrandFooter(req.brandFooter());
		}
		if (req.badge() != null) {
			plan.setBadge(req.badge().isBlank() ? null : req.badge());
		}
		if (req.active() != null) {
			plan.setActive(req.active());
		}
		plan.setUpdatedAt(Instant.now());

		return repository.save(plan);
	}

	@Transactional
	public PricingPlanEntity createPlan(PlanCreateRequest req, String adminKey) {
		requireAdmin(adminKey);
		if (req.id() == null || req.id().isBlank()) {
			throw new BadRequestException("ID paket wajib diisi");
		}
		String cleanId = req.id().trim().toUpperCase();
		if (repository.existsById(cleanId)) {
			throw new BadRequestException("Paket dengan ID '" + cleanId + "' sudah ada");
		}

		PricingPlanEntity entity = new PricingPlanEntity(
				cleanId,
				req.name() != null ? req.name() : cleanId,
				req.priceIdr() != null ? req.priceIdr() : 0,
				req.priceUsd() != null ? req.priceUsd() : 0,
				req.durationDays() != null && req.durationDays() > 0 ? req.durationDays() : 30,
				req.monthlyDocumentLimit() != null ? req.monthlyDocumentLimit() : 500,
				req.certificateMaxRecipients() != null ? req.certificateMaxRecipients() : 100,
				req.maxApiKeys() != null ? req.maxApiKeys() : 1,
				Boolean.TRUE.equals(req.brandFooter()),
				req.badge(),
				req.active() == null || req.active(),
				Instant.now()
		);

		return repository.save(entity);
	}

	@Transactional
	public void deletePlan(String id, String adminKey) {
		requireAdmin(adminKey);
		PricingPlanEntity plan = repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Paket '" + id + "' tidak ditemukan"));
		repository.delete(plan);
	}

	public void requireAdmin(String adminKey) {
		String secret = properties.actuatorPassword();
		if (adminKey == null || adminKey.isBlank() || !adminKey.equals(secret)) {
			throw new ForbiddenException("Akses ditolak: X-Admin-Key tidak valid atau tidak disertakan.");
		}
	}

	public record PlanUpdateRequest(
			String name,
			Integer priceIdr,
			Integer priceUsd,
			Integer durationDays,
			Integer monthlyDocumentLimit,
			Integer certificateMaxRecipients,
			Integer maxApiKeys,
			Boolean brandFooter,
			String badge,
			Boolean active
	) {}

	public record PlanCreateRequest(
			String id,
			String name,
			Integer priceIdr,
			Integer priceUsd,
			Integer durationDays,
			Integer monthlyDocumentLimit,
			Integer certificateMaxRecipients,
			Integer maxApiKeys,
			Boolean brandFooter,
			String badge,
			Boolean active
	) {}
}
