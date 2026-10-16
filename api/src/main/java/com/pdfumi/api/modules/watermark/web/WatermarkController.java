package com.pdfumi.api.modules.watermark.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.watermark.application.WatermarkService;
import com.pdfumi.api.shared.web.DownloadFilenames;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/watermark")
public class WatermarkController {

	private final WatermarkService watermarkService;
	private final AccountService accountService;

	public WatermarkController(WatermarkService watermarkService, AccountService accountService) {
		this.watermarkService = watermarkService;
		this.accountService = accountService;
	}

	@PostMapping(produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> watermark(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "text", defaultValue = "Pdfumi") String text,
			@RequestParam(value = "x", defaultValue = "0.35") float x,
			@RequestParam(value = "y", defaultValue = "0.55") float y,
			@RequestParam(value = "rotation", defaultValue = "35") float rotation,
			HttpServletRequest request
	) {
		byte[] pdf = watermarkService.apply(
				accountService.resolve(request),
				file,
				text,
				x,
				y,
				rotation
		);
		return DownloadFilenames.pdfAttachment(
				pdf,
				DownloadFilenames.fromUpload(file, "document.pdf", "pdf")
		);
	}
}
