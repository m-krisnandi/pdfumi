package com.pdfumi.api.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "promo_code")
public class PromoCodeEntity {

	@Id
	@Column(length = 64)
	private String code;

	@Column(name = "discount_percent", nullable = false)
	private int discountPercent;

	@Column(nullable = false, length = 32)
	private String plan;

	@Column(name = "max_uses", nullable = false)
	private int maxUses;

	@Column(name = "used_count", nullable = false)
	private int usedCount;

	@Column(name = "expires_at")
	private Instant expiresAt;

	@Column(name = "is_active", nullable = false)
	private boolean active;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected PromoCodeEntity() {
	}

	public PromoCodeEntity(
			String code,
			int discountPercent,
			String plan,
			int maxUses,
			int usedCount,
			Instant expiresAt,
			boolean active,
			Instant createdAt
	) {
		this.code = code;
		this.discountPercent = discountPercent;
		this.plan = plan;
		this.maxUses = maxUses;
		this.usedCount = usedCount;
		this.expiresAt = expiresAt;
		this.active = active;
		this.createdAt = createdAt;
	}

	public String getCode() {
		return code;
	}

	public int getDiscountPercent() {
		return discountPercent;
	}

	public void setDiscountPercent(int discountPercent) {
		this.discountPercent = discountPercent;
	}

	public String getPlan() {
		return plan;
	}

	public void setPlan(String plan) {
		this.plan = plan;
	}

	public int getMaxUses() {
		return maxUses;
	}

	public void setMaxUses(int maxUses) {
		this.maxUses = maxUses;
	}

	public int getUsedCount() {
		return usedCount;
	}

	public void incrementUsedCount() {
		this.usedCount++;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(Instant expiresAt) {
		this.expiresAt = expiresAt;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
