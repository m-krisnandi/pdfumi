package com.pdfumi.api.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recovery_token")
public class RecoveryTokenEntity {

	@Id
	private UUID id;

	@Column(name = "account_id", nullable = false)
	private UUID accountId;

	@Column(name = "token_hash", nullable = false, length = 128)
	private String tokenHash;

	@Column(length = 8)
	private String locale;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "used_at")
	private Instant usedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected RecoveryTokenEntity() {
	}

	public RecoveryTokenEntity(
			UUID id,
			UUID accountId,
			String tokenHash,
			String locale,
			Instant expiresAt,
			Instant createdAt
	) {
		this.id = id;
		this.accountId = accountId;
		this.tokenHash = tokenHash;
		this.locale = locale;
		this.expiresAt = expiresAt;
		this.createdAt = createdAt;
	}

	public UUID getId() {
		return id;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public String getLocale() {
		return locale;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getUsedAt() {
		return usedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public boolean isUsable(Instant now) {
		return usedAt == null && expiresAt.isAfter(now);
	}

	public void markUsed(Instant now) {
		this.usedAt = now;
	}
}
