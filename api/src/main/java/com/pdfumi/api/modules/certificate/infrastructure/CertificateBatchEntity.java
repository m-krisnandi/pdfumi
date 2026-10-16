package com.pdfumi.api.modules.certificate.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "certificate_batch")
public class CertificateBatchEntity {

	@Id
	private UUID id;

	@Column(name = "event_title", nullable = false, length = 255)
	private String eventTitle;

	@Column(length = 255)
	private String organization;

	@Column(name = "event_date", length = 64)
	private String eventDate;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected CertificateBatchEntity() {
	}

	public CertificateBatchEntity(UUID id, String eventTitle, String organization, String eventDate, Instant createdAt) {
		this.id = id;
		this.eventTitle = eventTitle;
		this.organization = organization;
		this.eventDate = eventDate;
		this.createdAt = createdAt;
	}

	public UUID getId() {
		return id;
	}

	public String getEventTitle() {
		return eventTitle;
	}

	public String getOrganization() {
		return organization;
	}

	public String getEventDate() {
		return eventDate;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
