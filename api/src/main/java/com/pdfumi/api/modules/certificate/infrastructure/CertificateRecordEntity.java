package com.pdfumi.api.modules.certificate.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "certificate_record")
public class CertificateRecordEntity {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "batch_id", nullable = false)
	private CertificateBatchEntity batch;

	@Column(name = "verify_code", nullable = false, length = 32, unique = true)
	private String verifyCode;

	@Column(name = "recipient_name", nullable = false, length = 255)
	private String recipientName;

	@Column(name = "recipient_title", length = 255)
	private String recipientTitle;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected CertificateRecordEntity() {
	}

	public CertificateRecordEntity(
			UUID id,
			CertificateBatchEntity batch,
			String verifyCode,
			String recipientName,
			String recipientTitle,
			Instant createdAt
	) {
		this.id = id;
		this.batch = batch;
		this.verifyCode = verifyCode;
		this.recipientName = recipientName;
		this.recipientTitle = recipientTitle;
		this.createdAt = createdAt;
	}

	public UUID getId() {
		return id;
	}

	public CertificateBatchEntity getBatch() {
		return batch;
	}

	public String getVerifyCode() {
		return verifyCode;
	}

	public String getRecipientName() {
		return recipientName;
	}

	public String getRecipientTitle() {
		return recipientTitle;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
