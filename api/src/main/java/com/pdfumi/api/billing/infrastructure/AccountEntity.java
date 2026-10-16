package com.pdfumi.api.billing.infrastructure;

import com.pdfumi.api.billing.domain.Plan;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account")
public class AccountEntity {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private Plan plan;

	@Column(name = "subscription_status", length = 32)
	private String subscriptionStatus;

	@Column(name = "current_period_end")
	private Instant currentPeriodEnd;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected AccountEntity() {
	}

	public AccountEntity(UUID id, String email, Plan plan, Instant now) {
		this.id = id;
		this.email = email;
		this.plan = plan;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public Plan getPlan() {
		return plan;
	}

	public void setPlan(Plan plan) {
		this.plan = plan;
		this.updatedAt = Instant.now();
	}

	public String getSubscriptionStatus() {
		return subscriptionStatus;
	}

	public void setSubscriptionStatus(String subscriptionStatus) {
		this.subscriptionStatus = subscriptionStatus;
		this.updatedAt = Instant.now();
	}

	public Instant getCurrentPeriodEnd() {
		return currentPeriodEnd;
	}

	public void setCurrentPeriodEnd(Instant currentPeriodEnd) {
		this.currentPeriodEnd = currentPeriodEnd;
		this.updatedAt = Instant.now();
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
