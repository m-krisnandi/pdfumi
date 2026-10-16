package com.pdfumi.api.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "pricing_plan")
public class PricingPlanEntity {

	@Id
	@Column(length = 32)
	private String id;

	@Column(nullable = false, length = 64)
	private String name;

	@Column(name = "price_idr", nullable = false)
	private int priceIdr;

	@Column(name = "price_usd", nullable = false)
	private int priceUsd;

	@Column(name = "duration_days", nullable = false)
	private int durationDays;

	@Column(name = "monthly_document_limit", nullable = false)
	private int monthlyDocumentLimit;

	@Column(name = "certificate_max_recipients", nullable = false)
	private int certificateMaxRecipients;

	@Column(name = "max_api_keys", nullable = false)
	private int maxApiKeys;

	@Column(name = "brand_footer", nullable = false)
	private boolean brandFooter;

	@Column(length = 64)
	private String badge;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	public PricingPlanEntity() {
	}

	public PricingPlanEntity(
			String id,
			String name,
			int priceIdr,
			int priceUsd,
			int durationDays,
			int monthlyDocumentLimit,
			int certificateMaxRecipients,
			int maxApiKeys,
			boolean brandFooter,
			String badge,
			boolean active,
			Instant updatedAt
	) {
		this.id = id;
		this.name = name;
		this.priceIdr = priceIdr;
		this.priceUsd = priceUsd;
		this.durationDays = durationDays;
		this.monthlyDocumentLimit = monthlyDocumentLimit;
		this.certificateMaxRecipients = certificateMaxRecipients;
		this.maxApiKeys = maxApiKeys;
		this.brandFooter = brandFooter;
		this.badge = badge;
		this.active = active;
		this.updatedAt = updatedAt;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getPriceIdr() {
		return priceIdr;
	}

	public void setPriceIdr(int priceIdr) {
		this.priceIdr = priceIdr;
	}

	public int getPriceUsd() {
		return priceUsd;
	}

	public void setPriceUsd(int priceUsd) {
		this.priceUsd = priceUsd;
	}

	public int getDurationDays() {
		return durationDays;
	}

	public void setDurationDays(int durationDays) {
		this.durationDays = durationDays;
	}

	public int getMonthlyDocumentLimit() {
		return monthlyDocumentLimit;
	}

	public void setMonthlyDocumentLimit(int monthlyDocumentLimit) {
		this.monthlyDocumentLimit = monthlyDocumentLimit;
	}

	public int getCertificateMaxRecipients() {
		return certificateMaxRecipients;
	}

	public void setCertificateMaxRecipients(int certificateMaxRecipients) {
		this.certificateMaxRecipients = certificateMaxRecipients;
	}

	public int getMaxApiKeys() {
		return maxApiKeys;
	}

	public void setMaxApiKeys(int maxApiKeys) {
		this.maxApiKeys = maxApiKeys;
	}

	public boolean isBrandFooter() {
		return brandFooter;
	}

	public void setBrandFooter(boolean brandFooter) {
		this.brandFooter = brandFooter;
	}

	public String getBadge() {
		return badge;
	}

	public void setBadge(String badge) {
		this.badge = badge;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
