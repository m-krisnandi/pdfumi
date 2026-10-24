package com.pdfumi.api.modules.convert.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.modules.convert.infrastructure.PdfBoxImagesToPdfEngine;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Service
public class ConvertService {

	public static final String TOOL_IMAGES_TO_PDF = "jpg-to-pdf";
	public static final String TOOL_PDF_TO_PNG = "pdf-to-png";
	public static final String TOOL_PDF_TO_JPG = "pdf-to-jpg";
	public static final String TOOL_PDF_TO_WORD = "pdf-to-word";
	public static final String TOOL_WORD_TO_PDF = "word-to-pdf";
	public static final String TOOL_PDF_TO_EXCEL = "pdf-to-excel";
	public static final String TOOL_EXCEL_TO_PDF = "excel-to-pdf";

	private final QuotaService quotaService;
	private final ImagesToPdfEngine imagesToPdfEngine;
	private final PdfToImagesEngine pdfToImagesEngine;
	private final OfficeConvertEngine officeConvertEngine;
	private final PdfumiMetrics metrics;

	public ConvertService(
			QuotaService quotaService,
			ImagesToPdfEngine imagesToPdfEngine,
			PdfToImagesEngine pdfToImagesEngine,
			OfficeConvertEngine officeConvertEngine,
			PdfumiMetrics metrics
	) {
		this.quotaService = quotaService;
		this.imagesToPdfEngine = imagesToPdfEngine;
		this.pdfToImagesEngine = pdfToImagesEngine;
		this.officeConvertEngine = officeConvertEngine;
		this.metrics = metrics;
	}

	public byte[] imagesToPdf(ClientContext client, List<MultipartFile> files) {
		return run(TOOL_IMAGES_TO_PDF, () -> {
			validateImages(client, files);
			byte[] res = imagesToPdfEngine.convert(files);
			quotaService.consume(client, TOOL_IMAGES_TO_PDF);
			return res;
		});
	}

	public byte[] pdfToImages(ClientContext client, MultipartFile file, String format) {
		String tool = "png".equalsIgnoreCase(format) ? TOOL_PDF_TO_PNG : TOOL_PDF_TO_JPG;
		return run(tool, () -> {
			validatePdf(client, file);
			byte[] res = pdfToImagesEngine.convert(file, format);
			quotaService.consume(client, tool);
			return res;
		});
	}

	public byte[] pdfToWord(ClientContext client, MultipartFile file) {
		return run(TOOL_PDF_TO_WORD, () -> {
			validatePdf(client, file);
			byte[] res;
			try {
				res = officeConvertEngine.pdfToDocx(file);
			} catch (IllegalStateException ex) {
				throw new BadRequestException(friendlyOfficeError(ex));
			}
			quotaService.consume(client, TOOL_PDF_TO_WORD);
			return res;
		});
	}

	public byte[] wordToPdf(ClientContext client, MultipartFile file) {
		return run(TOOL_WORD_TO_PDF, () -> {
			validateWord(client, file);
			byte[] res;
			try {
				res = officeConvertEngine.wordToPdf(file);
			} catch (IllegalStateException ex) {
				throw new BadRequestException(friendlyOfficeError(ex));
			}
			quotaService.consume(client, TOOL_WORD_TO_PDF);
			return res;
		});
	}

	public byte[] pdfToExcel(ClientContext client, MultipartFile file) {
		return run(TOOL_PDF_TO_EXCEL, () -> {
			validatePdf(client, file);
			byte[] res;
			try {
				res = officeConvertEngine.pdfToXlsx(file);
			} catch (IllegalStateException ex) {
				throw new BadRequestException(friendlyOfficeError(ex));
			}
			quotaService.consume(client, TOOL_PDF_TO_EXCEL);
			return res;
		});
	}

	public byte[] excelToPdf(ClientContext client, MultipartFile file) {
		return run(TOOL_EXCEL_TO_PDF, () -> {
			validateExcel(client, file);
			byte[] res;
			try {
				res = officeConvertEngine.excelToPdf(file);
			} catch (IllegalStateException ex) {
				throw new BadRequestException(friendlyOfficeError(ex));
			}
			quotaService.consume(client, TOOL_EXCEL_TO_PDF);
			return res;
		});
	}

	private static String friendlyOfficeError(IllegalStateException ex) {
		String msg = ex.getMessage() == null ? "" : ex.getMessage();
		if (msg.contains("Cannot run program") || msg.contains("No such file") || msg.contains("error=2")) {
			return "LibreOffice is not installed. Install LibreOffice or set pdfumi.office.soffice-path.";
		}
		return "Office conversion failed: " + msg;
	}

	private byte[] run(String tool, Action action) {
		long started = System.nanoTime();
		try {
			byte[] result = action.run();
			metrics.recordSuccess(tool);
			return result;
		} catch (QuotaExceededException ex) {
			metrics.recordFailure(tool, "quota");
			throw ex;
		} catch (BadRequestException ex) {
			metrics.recordFailure(tool, "validation");
			throw ex;
		} catch (RuntimeException ex) {
			metrics.recordFailure(tool, "error");
			throw ex;
		} finally {
			metrics.recordDuration(tool, started);
		}
	}

	private void validateImages(ClientContext client, List<MultipartFile> files) {
		if (files == null || files.isEmpty()) {
			throw new BadRequestException("Upload minimal 1 gambar");
		}
		int maxImages = client.entitlements().maxBatchFiles();
		if (files.size() > maxImages) {
			throw new BadRequestException("Maksimal " + maxImages + " gambar untuk paket " + client.plan().name());
		}
		long maxBytes = client.entitlements().maxFileSizeBytes();
		int maxMb = client.entitlements().maxFileSizeMb();
		for (MultipartFile file : files) {
			if (file == null || file.isEmpty()) {
				throw new BadRequestException("Ada file kosong");
			}
			if (file.getSize() > maxBytes) {
				throw new BadRequestException("Setiap file maksimal " + maxMb + "MB untuk paket " + client.plan().name());
			}
			if (!PdfBoxImagesToPdfEngine.isImage(file)) {
				throw new BadRequestException("Hanya JPG, PNG, WebP, GIF, atau BMP");
			}
		}
	}

	private void validatePdf(ClientContext client, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Upload 1 file PDF");
		}
		long maxBytes = client.entitlements().maxFileSizeBytes();
		int maxMb = client.entitlements().maxFileSizeMb();
		if (file.getSize() > maxBytes) {
			throw new BadRequestException("File maksimal " + maxMb + "MB untuk paket " + client.plan().name());
		}
		String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
		String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
		if (!type.contains("pdf") && !name.endsWith(".pdf")) {
			throw new BadRequestException("File harus PDF");
		}
		try {
			byte[] signature = file.getInputStream().readNBytes(5);
			if (signature.length != 5
					|| signature[0] != '%'
					|| signature[1] != 'P'
					|| signature[2] != 'D'
					|| signature[3] != 'F'
					|| signature[4] != '-') {
				throw new BadRequestException("File bukan PDF yang valid");
			}
		} catch (IOException ex) {
			throw new BadRequestException("PDF tidak dapat dibaca");
		}
	}

	private void validateWord(ClientContext client, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Upload 1 file Word (.doc / .docx)");
		}
		long maxBytes = client.entitlements().maxFileSizeBytes();
		int maxMb = client.entitlements().maxFileSizeMb();
		if (file.getSize() > maxBytes) {
			throw new BadRequestException("File maksimal " + maxMb + "MB untuk paket " + client.plan().name());
		}
		String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
		String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
		boolean okExt = name.endsWith(".docx") || name.endsWith(".doc");
		boolean okType = type.contains("word") || type.contains("msword") || type.contains("officedocument");
		if (!okExt && !okType) {
			throw new BadRequestException("Hanya .doc atau .docx");
		}
	}

	private void validateExcel(ClientContext client, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Upload 1 file Excel (.xls / .xlsx)");
		}
		long maxBytes = client.entitlements().maxFileSizeBytes();
		int maxMb = client.entitlements().maxFileSizeMb();
		if (file.getSize() > maxBytes) {
			throw new BadRequestException("File maksimal " + maxMb + "MB untuk paket " + client.plan().name());
		}
		String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
		String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
		boolean okExt = name.endsWith(".xlsx") || name.endsWith(".xls");
		boolean okType = type.contains("sheet") || type.contains("excel") || type.contains("ms-excel");
		if (!okExt && !okType) {
			throw new BadRequestException("Hanya .xls atau .xlsx");
		}
	}

	@FunctionalInterface
	private interface Action {
		byte[] run();
	}
}
