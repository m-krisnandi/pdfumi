package com.pdfumi.api.modules.convert.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.modules.convert.application.ConvertService;
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
@RequestMapping("/api/v1/convert")
public class ConvertController {

	private static final MediaType DOCX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	);
	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	);

	private final ConvertService convertService;
	private final AccountService accountService;

	public ConvertController(ConvertService convertService, AccountService accountService) {
		this.convertService = convertService;
		this.accountService = accountService;
	}

	@PostMapping(path = "/images-to-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> imagesToPdf(
			@RequestParam("files") List<MultipartFile> files,
			HttpServletRequest request
	) {
		byte[] pdf = convertService.imagesToPdf(accountService.resolve(request), files);
		return DownloadFilenames.pdfAttachment(
				pdf,
				DownloadFilenames.fromUploads(files, "images.pdf", "pdf")
		);
	}

	@PostMapping(path = "/pdf-to-images", produces = "application/zip")
	public ResponseEntity<byte[]> pdfToImages(
			@RequestParam("file") MultipartFile file,
			@RequestParam(defaultValue = "jpg") String format,
			HttpServletRequest request
	) {
		byte[] zip = convertService.pdfToImages(accountService.resolve(request), file, format);
		return DownloadFilenames.zipAttachment(
				zip,
				DownloadFilenames.fromUpload(file, "pages.zip", "zip")
		);
	}

	@PostMapping(path = "/pdf-to-word", produces = "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	public ResponseEntity<byte[]> pdfToWord(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request
	) {
		byte[] docx = convertService.pdfToWord(accountService.resolve(request), file);
		return DownloadFilenames.attachment(
				docx,
				DownloadFilenames.fromUpload(file, "document.docx", "docx"),
				DOCX
		);
	}

	@PostMapping(path = "/word-to-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> wordToPdf(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request
	) {
		byte[] pdf = convertService.wordToPdf(accountService.resolve(request), file);
		return DownloadFilenames.pdfAttachment(
				pdf,
				DownloadFilenames.fromUpload(file, "document.pdf", "pdf")
		);
	}

	@PostMapping(path = "/pdf-to-excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	public ResponseEntity<byte[]> pdfToExcel(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request
	) {
		byte[] xlsx = convertService.pdfToExcel(accountService.resolve(request), file);
		return DownloadFilenames.attachment(
				xlsx,
				DownloadFilenames.fromUpload(file, "document.xlsx", "xlsx"),
				XLSX
		);
	}

	@PostMapping(path = "/excel-to-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> excelToPdf(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request
	) {
		byte[] pdf = convertService.excelToPdf(accountService.resolve(request), file);
		return DownloadFilenames.pdfAttachment(
				pdf,
				DownloadFilenames.fromUpload(file, "document.pdf", "pdf")
		);
	}
}
