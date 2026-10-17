package com.pdfumi.api.feedback.web;

import com.pdfumi.api.feedback.application.FeedbackReportService;
import com.pdfumi.api.feedback.application.FeedbackReportService.SubmitReportRequest;
import com.pdfumi.api.feedback.application.FeedbackReportService.UpdateReportRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feedback")
@Tag(name = "Feedback & Bug Reports")
public class FeedbackReportController {

	private final FeedbackReportService service;

	public FeedbackReportController(FeedbackReportService service) {
		this.service = service;
	}

	@PostMapping
	@Operation(summary = "Submit a user feedback, bug report, or feature request")
	public ResponseEntity<Map<String, Object>> submitFeedback(
			@RequestBody SubmitReportRequest req,
			HttpServletRequest request
	) {
		Map<String, Object> resp = service.submitReport(req, request);
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/admin")
	@Operation(summary = "Admin list all feedback and bug reports (requires X-Admin-Key)")
	public List<Map<String, Object>> getAdminReports(
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "category", required = false) String category,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.getAllReports(adminKey, status, category);
	}

	@PutMapping("/admin/{id}")
	@Operation(summary = "Admin update report status, reply message, or notes (requires X-Admin-Key)")
	public Map<String, Object> updateReport(
			@PathVariable UUID id,
			@RequestBody UpdateReportRequest req,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		return service.updateReport(id, req, adminKey);
	}

	@DeleteMapping("/admin/{id}")
	@Operation(summary = "Admin delete a report (requires X-Admin-Key)")
	public ResponseEntity<Void> deleteReport(
			@PathVariable UUID id,
			@RequestHeader(value = "X-Admin-Key", required = false) String adminKey
	) {
		service.deleteReport(id, adminKey);
		return ResponseEntity.noContent().build();
	}
}
