package com.pdfumi.api.feedback.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback_report")
public class FeedbackReportEntity {

	@Id
	private UUID id;

	@Column(nullable = false, length = 32)
	private String category; // 'BUG', 'FEATURE', 'FEEDBACK'

	@Column(nullable = false, length = 200)
	private String subject;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(length = 255)
	private String email;

	@Column(name = "account_id")
	private UUID accountId;

	@Column(nullable = false, length = 32)
	private String status; // 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'

	@Column(name = "admin_notes", columnDefinition = "TEXT")
	private String adminNotes;

	@Column(name = "reply_message", columnDefinition = "TEXT")
	private String replyMessage;

	@Column(name = "screenshots", columnDefinition = "TEXT")
	private String screenshots;

	@Column(name = "replied_at")
	private Instant repliedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected FeedbackReportEntity() {
	}

	public FeedbackReportEntity(
			UUID id,
			String category,
			String subject,
			String description,
			String email,
			UUID accountId,
			String status,
			Instant createdAt
	) {
		this.id = id;
		this.category = category;
		this.subject = subject;
		this.description = description;
		this.email = email;
		this.accountId = accountId;
		this.status = status;
		this.createdAt = createdAt;
	}

	public UUID getId() {
		return id;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public void setAccountId(UUID accountId) {
		this.accountId = accountId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getAdminNotes() {
		return adminNotes;
	}

	public void setAdminNotes(String adminNotes) {
		this.adminNotes = adminNotes;
	}

	public String getReplyMessage() {
		return replyMessage;
	}

	public void setReplyMessage(String replyMessage) {
		this.replyMessage = replyMessage;
	}

	public String getScreenshots() {
		return screenshots;
	}

	public void setScreenshots(String screenshots) {
		this.screenshots = screenshots;
	}

	public Instant getRepliedAt() {
		return repliedAt;
	}

	public void setRepliedAt(Instant repliedAt) {
		this.repliedAt = repliedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
