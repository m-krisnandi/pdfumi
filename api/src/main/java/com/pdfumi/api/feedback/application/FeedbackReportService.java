package com.pdfumi.api.feedback.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.billing.application.PricingPlanService;
import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.feedback.infrastructure.FeedbackReportEntity;
import com.pdfumi.api.feedback.infrastructure.FeedbackReportRepository;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.shared.mail.TransactionalMailer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FeedbackReportService {

	private final FeedbackReportRepository repository;
	private final PricingPlanService pricingPlanService;
	private final AccountService accountService;
	private final TransactionalMailer mailer;
	private final ObjectMapper objectMapper;

	public FeedbackReportService(
			FeedbackReportRepository repository,
			PricingPlanService pricingPlanService,
			AccountService accountService,
			TransactionalMailer mailer
	) {
		this.repository = repository;
		this.pricingPlanService = pricingPlanService;
		this.accountService = accountService;
		this.mailer = mailer;
		this.objectMapper = new ObjectMapper();
	}

	@Transactional
	public Map<String, Object> submitReport(SubmitReportRequest req, HttpServletRequest request) {
		if (req.subject() == null || req.subject().isBlank()) {
			throw new BadRequestException("Judul / subjek laporan wajib diisi");
		}
		if (req.description() == null || req.description().isBlank()) {
			throw new BadRequestException("Deskripsi laporan wajib diisi");
		}

		String category = "FEEDBACK";
		if (req.category() != null) {
			String catUpper = req.category().trim().toUpperCase();
			if (List.of("BUG", "FEATURE", "FEEDBACK").contains(catUpper)) {
				category = catUpper;
			}
		}

		UUID accountId = null;
		String userEmail = req.email() != null && !req.email().isBlank() ? req.email().trim().toLowerCase() : null;

		if (request != null) {
			try {
				ClientContext client = accountService.resolve(request);
				if (client.isAuthenticated()) {
					accountId = client.accountId();
					if (userEmail == null && client.email() != null) {
						userEmail = client.email();
					}
				}
			} catch (Exception ignored) {
				// Anonymous submit fallback
			}
		}

		FeedbackReportEntity entity = new FeedbackReportEntity(
				UUID.randomUUID(),
				category,
				req.subject().trim(),
				req.description().trim(),
				userEmail,
				accountId,
				"OPEN",
				Instant.now()
		);

		if (req.screenshots() != null && !req.screenshots().isEmpty()) {
			try {
				entity.setScreenshots(objectMapper.writeValueAsString(req.screenshots()));
			} catch (Exception ignored) {
			}
		}

		FeedbackReportEntity saved = repository.save(entity);

		Map<String, Object> resp = new HashMap<>();
		resp.put("id", saved.getId());
		resp.put("status", saved.getStatus());
		resp.put("message", "Laporan berhasil dikirim. Terima kasih atas masukan Anda!");
		return resp;
	}

	@Transactional(readOnly = true)
	public List<Map<String, Object>> getAllReports(String adminKey, String status, String category) {
		pricingPlanService.requireAdmin(adminKey);

		List<FeedbackReportEntity> list;
		if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
			list = repository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
		} else if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
			list = repository.findByCategoryOrderByCreatedAtDesc(category.toUpperCase());
		} else {
			list = repository.findAllByOrderByCreatedAtDesc();
		}

		return list.stream().map(this::toMap).toList();
	}

	@Transactional
	public Map<String, Object> updateReport(UUID id, UpdateReportRequest req, String adminKey) {
		pricingPlanService.requireAdmin(adminKey);

		FeedbackReportEntity entity = repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Laporan tidak ditemukan"));

		if (req.status() != null && !req.status().isBlank()) {
			entity.setStatus(req.status().trim().toUpperCase());
		}
		if (req.adminNotes() != null) {
			entity.setAdminNotes(req.adminNotes());
		}

		if (req.replyMessage() != null && !req.replyMessage().isBlank()) {
			String reply = req.replyMessage().trim();
			entity.setReplyMessage(reply);
			entity.setRepliedAt(Instant.now());

			if (Boolean.TRUE.equals(req.sendEmail()) && entity.getEmail() != null && !entity.getEmail().isBlank()) {
				String subject = "Tanggapan Laporan Pdfumi: " + entity.getSubject();
				String body = String.format(
						"Halo,\n\nTerima kasih telah mengirimkan masukan kepada Pdfumi.\n\n"
								+ "Subjek Laporan: %s\nStatus: %s\n\nTanggapan dari Admin:\n%s\n\n"
								+ "Salam hangat,\nTim Pdfumi\nhttps://pdfumi.com",
						entity.getSubject(),
						entity.getStatus(),
						reply
				);
				mailer.sendText(entity.getEmail(), subject, body);
			}
		}

		FeedbackReportEntity saved = repository.save(entity);
		return toMap(saved);
	}

	@Transactional
	public void deleteReport(UUID id, String adminKey) {
		pricingPlanService.requireAdmin(adminKey);
		FeedbackReportEntity entity = repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Laporan tidak ditemukan"));
		repository.delete(entity);
	}

	private Map<String, Object> toMap(FeedbackReportEntity e) {
		Map<String, Object> map = new HashMap<>();
		map.put("id", e.getId());
		map.put("category", e.getCategory());
		map.put("subject", e.getSubject());
		map.put("description", e.getDescription());
		map.put("email", e.getEmail());
		map.put("accountId", e.getAccountId());
		map.put("status", e.getStatus());
		map.put("adminNotes", e.getAdminNotes());
		map.put("replyMessage", e.getReplyMessage());
		map.put("repliedAt", e.getRepliedAt());
		map.put("createdAt", e.getCreatedAt());

		List<String> screenshotsList = new ArrayList<>();
		if (e.getScreenshots() != null && !e.getScreenshots().isBlank()) {
			try {
				screenshotsList = objectMapper.readValue(e.getScreenshots(), new TypeReference<List<String>>() {});
			} catch (Exception ignored) {
			}
		}
		map.put("screenshots", screenshotsList);

		return map;
	}

	public record SubmitReportRequest(
			String category,
			String subject,
			String description,
			String email,
			List<String> screenshots
	) {}

	public record UpdateReportRequest(
			String status,
			String adminNotes,
			String replyMessage,
			Boolean sendEmail
	) {}
}
