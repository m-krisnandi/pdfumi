package com.pdfumi.api.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_key")
public class ApiKeyEntity {

	@Id
	private UUID id;

	@Column(name = "account_id", nullable = false)
	private UUID accountId;

	@Column(name = "key_prefix", nullable = false, length = 24)
	private String keyPrefix;

	@Column(name = "key_hash", nullable = false, length = 128)
	private String keyHash;

	@Column(length = 128)
	private String label;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "revoked_at")
	private Instant revokedAt;

	protected ApiKeyEntity() {
	}

	public ApiKeyEntity(UUID id, UUID accountId, String keyPrefix, String keyHash, String label, Instant createdAt) {
		this.id = id;
		this.accountId = accountId;
		this.keyPrefix = keyPrefix;
		this.keyHash = keyHash;
		this.label = label;
		this.createdAt = createdAt;
	}

	public UUID getId() {
		return id;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public String getKeyPrefix() {
		return keyPrefix;
	}

	public String getKeyHash() {
		return keyHash;
	}

	public String getLabel() {
		return label;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getRevokedAt() {
		return revokedAt;
	}

	public boolean isActive() {
		return revokedAt == null;
	}

	public void revoke() {
		this.revokedAt = Instant.now();
	}
}
