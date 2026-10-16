package com.pdfumi.api.modules.kwitansi.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.kwitansi.application.KwitansiCommand;
import com.pdfumi.api.modules.kwitansi.application.KwitansiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/kwitansi")
@Tag(name = "Kwitansi")
public class KwitansiController {

	private final KwitansiService kwitansiService;
	private final AccountService accountService;

	public KwitansiController(KwitansiService kwitansiService, AccountService accountService) {
		this.kwitansiService = kwitansiService;
		this.accountService = accountService;
	}

	@GetMapping("/quota")
	@Operation(summary = "Cek kuota harian kwitansi")
	public Map<String, Object> quota(HttpServletRequest request) {
		return kwitansiService.quota(accountService.resolve(request));
	}

	@PostMapping(path = "/preview", produces = MediaType.APPLICATION_PDF_VALUE)
	@Operation(summary = "Preview kwitansi PDF (no quota)")
	public ResponseEntity<byte[]> preview(@Valid @RequestBody KwitansiCommand body) {
		byte[] pdf = kwitansiService.preview(body);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"kwitansi-preview.pdf\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}

	@PostMapping(produces = MediaType.APPLICATION_PDF_VALUE)
	@Operation(summary = "Generate kwitansi PDF")
	public ResponseEntity<byte[]> create(@Valid @RequestBody KwitansiCommand body, HttpServletRequest request) {
		byte[] pdf = kwitansiService.create(accountService.resolve(request), body);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"kwitansi-pdfumi.pdf\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}
}
