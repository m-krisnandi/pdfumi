package com.pdfumi.api.modules.merge.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.merge.application.MergePdfService;
import com.pdfumi.api.shared.web.DownloadFilenames;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/merge")
public class MergePdfController {

	private final MergePdfService mergePdfService;
	private final AccountService accountService;

	public MergePdfController(MergePdfService mergePdfService, AccountService accountService) {
		this.mergePdfService = mergePdfService;
		this.accountService = accountService;
	}

	@PostMapping(produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> merge(
			@RequestParam("files") List<MultipartFile> files,
			HttpServletRequest request
	) {
		byte[] pdf = mergePdfService.merge(accountService.resolve(request), files);
		return DownloadFilenames.pdfAttachment(
				pdf,
				DownloadFilenames.fromUploads(files, "merged.pdf", "pdf")
		);
	}
}
