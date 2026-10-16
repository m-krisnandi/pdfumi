package com.pdfumi.api.modules.certificate.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.certificate.application.CertificateCommand;
import com.pdfumi.api.modules.certificate.application.CertificateService;
import com.pdfumi.api.modules.certificate.application.CertificateVerifyResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/certificates")
@Tag(name = "Certificates")
public class CertificateController {

	private final CertificateService certificateService;
	private final AccountService accountService;

	public CertificateController(CertificateService certificateService, AccountService accountService) {
		this.certificateService = certificateService;
		this.accountService = accountService;
	}

	@GetMapping("/quota")
	@Operation(summary = "Check certificate quota")
	public Map<String, Object> quota(HttpServletRequest request) {
		return certificateService.quota(accountService.resolve(request));
	}

	@PostMapping(produces = MediaType.APPLICATION_PDF_VALUE)
	@Operation(summary = "Generate bulk certificates PDF with QR verify codes")
	public ResponseEntity<byte[]> create(@Valid @RequestBody CertificateCommand body, HttpServletRequest request) {
		byte[] pdf = certificateService.create(accountService.resolve(request), body);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificates-pdfumi.pdf\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}

	@PostMapping(path = "/preview", produces = MediaType.APPLICATION_PDF_VALUE)
	@Operation(summary = "Preview first certificate page (no quota, no verify persistence)")
	public ResponseEntity<byte[]> preview(@Valid @RequestBody CertificateCommand body) {
		byte[] pdf = certificateService.preview(body);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"certificate-preview.pdf\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}

	@GetMapping("/verify/{code}")
	@Operation(summary = "Verify a certificate by public code")
	public CertificateVerifyResult verify(@PathVariable String code) {
		return certificateService.verify(code);
	}
}
