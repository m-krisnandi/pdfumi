package com.pdfumi.api.modules.pdfops.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.pdfops.application.PdfOpsService;
import com.pdfumi.api.shared.web.DownloadFilenames;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/v1/pdf")
@Tag(name = "PDF Operations")
public class PdfOpsController {

	private final PdfOpsService pdfOpsService;
	private final AccountService accountService;

	public PdfOpsController(PdfOpsService pdfOpsService, AccountService accountService) {
		this.pdfOpsService = pdfOpsService;
		this.accountService = accountService;
	}

	@PostMapping(path = "/compress", produces = MediaType.APPLICATION_PDF_VALUE)
	@Operation(summary = "Compress PDF stream")
	public ResponseEntity<byte[]> compress(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.compress(accountService.resolve(request), file);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-compressed.pdf", "pdf"));
	}

	@PostMapping(path = "/split", produces = "application/zip")
	public ResponseEntity<byte[]> split(
			@RequestParam("file") MultipartFile file,
			@RequestParam(required = false) List<Integer> pages,
			HttpServletRequest request
	) {
		byte[] zip = pdfOpsService.splitPages(accountService.resolve(request), file, pages);
		return ResponseEntity.ok()
				.header("Content-Disposition", "attachment; filename=\"pages.zip\"")
				.body(zip);
	}

	@PostMapping(path = "/rotate", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> rotate(
			@RequestParam("file") MultipartFile file,
			@RequestParam int degrees,
			@RequestParam(required = false) List<Integer> pages,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.rotate(accountService.resolve(request), file, degrees, pages);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-rotated.pdf", "pdf"));
	}

	@PostMapping(path = "/delete-pages", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> deletePages(
			@RequestParam("file") MultipartFile file,
			@RequestParam List<Integer> pages,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.deletePages(accountService.resolve(request), file, pages);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document.pdf", "pdf"));
	}

	@PostMapping(path = "/extract-pages", produces = "application/zip")
	public ResponseEntity<byte[]> extractPages(
			@RequestParam("file") MultipartFile file,
			@RequestParam List<Integer> pages,
			HttpServletRequest request
	) {
		byte[] zip = pdfOpsService.extractPages(accountService.resolve(request), file, pages);
		return ResponseEntity.ok()
				.header("Content-Disposition", "attachment; filename=\"extracted-pages.zip\"")
				.body(zip);
	}

	@PostMapping(path = "/organize", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> organize(
			@RequestParam("file") MultipartFile file,
			@RequestParam List<Integer> pageOrder,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.organize(accountService.resolve(request), file, pageOrder);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-organized.pdf", "pdf"));
	}

	@PostMapping(path = "/protect", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> protect(
			@RequestParam("file") MultipartFile file,
			@RequestParam("password") String password,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.protect(accountService.resolve(request), file, password, password);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-protected.pdf", "pdf"));
	}

	@PostMapping(path = "/unlock", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> unlock(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "password", required = false, defaultValue = "") String password,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.unlock(accountService.resolve(request), file, password);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-unlocked.pdf", "pdf"));
	}

	@PostMapping(path = "/page-numbers", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> pageNumbers(
			@RequestParam("file") MultipartFile file,
			@RequestParam(defaultValue = "bottom-center") String position,
			@RequestParam(defaultValue = "n") String format,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.addPageNumbers(accountService.resolve(request), file, position, format);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-numbered.pdf", "pdf"));
	}

	@PostMapping(path = "/crop", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> crop(
			@RequestParam("file") MultipartFile file,
			@RequestParam(defaultValue = "0.08") float margin,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.crop(accountService.resolve(request), file, margin, margin, margin, margin);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document-cropped.pdf", "pdf"));
	}

	@PostMapping(path = "/sign", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> sign(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "signature", required = false) MultipartFile signature,
			@RequestParam(defaultValue = "0.5") float x,
			@RequestParam(defaultValue = "0.5") float y,
			@RequestParam(defaultValue = "0.25") float width,
			@RequestParam(defaultValue = "0") int page,
			HttpServletRequest request
	) {
		byte[] pdf = pdfOpsService.sign(accountService.resolve(request), file, signature, x, y, width, page);
		return DownloadFilenames.pdfAttachment(pdf, DownloadFilenames.fromUpload(file, "document.pdf", "pdf"));
	}
}
