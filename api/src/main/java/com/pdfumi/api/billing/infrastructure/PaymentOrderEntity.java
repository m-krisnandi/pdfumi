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
@Table(name = "payment_order")
public class PaymentOrderEntity {

	@Id
	private UUID id;

	@Column(name = "account_id", nullable = false)
	private UUID accountId;

	@Column(name = "order_reference", nullable = false, unique = true, length = 64)
	private String orderReference;

	@Column(nullable = false, length = 32)
	private String gateway;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private Plan plan;

	@Column(name = "duration_months", nullable = false)
	private int durationMonths;

	@Column(nullable = false)
	private int amount;

	@Column(nullable = false, length = 32)
	private String status;

	@Column(name = "qr_string", columnDefinition = "TEXT")
	private String qrString;

	@Column(name = "qr_url", columnDefinition = "TEXT")
	private String qrUrl;

	@Column(name = "checkout_url", columnDefinition = "TEXT")
	private String checkoutUrl;

	@Column(name = "paid_at")
	private Instant paidAt;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected PaymentOrderEntity() {
	}

	public PaymentOrderEntity(
			UUID id,
			UUID accountId,
			String orderReference,
			String gateway,
			Plan plan,
			int durationMonths,
			int amount,
			String status,
			String qrString,
			String qrUrl,
			String checkoutUrl,
			Instant expiresAt,
			Instant now
	) {
		this.id = id;
		this.accountId = accountId;
		this.orderReference = orderReference;
		this.gateway = gateway;
		this.plan = plan;
		this.durationMonths = durationMonths;
		this.amount = amount;
		this.status = status;
		this.qrString = qrString;
		this.qrUrl = qrUrl;
		this.checkoutUrl = checkoutUrl;
		this.expiresAt = expiresAt;
		this.createdAt = now;
		this.updatedAt = now;
	}

	public UUID getId() {
		return id;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public String getOrderReference() {
		return orderReference;
	}

	public String getGateway() {
		return gateway;
	}

	public Plan getPlan() {
		return plan;
	}

	public int getDurationMonths() {
		return durationMonths;
	}

	public int getAmount() {
		return amount;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
		this.updatedAt = Instant.now();
	}

	public String getQrString() {
		return qrString;
	}

	public void setQrString(String qrString) {
		this.qrString = qrString;
		this.updatedAt = Instant.now();
	}

	public String getQrUrl() {
		return qrUrl;
	}

	public void setQrUrl(String qrUrl) {
		this.qrUrl = qrUrl;
		this.updatedAt = Instant.now();
	}

	public String getCheckoutUrl() {
		return checkoutUrl;
	}

	public void setCheckoutUrl(String checkoutUrl) {
		this.checkoutUrl = checkoutUrl;
		this.updatedAt = Instant.now();
	}

	public Instant getPaidAt() {
		return paidAt;
	}

	public void setPaidAt(Instant paidAt) {
		this.paidAt = paidAt;
		this.updatedAt = Instant.now();
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
