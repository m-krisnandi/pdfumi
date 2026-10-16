package com.pdfumi.api.modules.watermark.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class WatermarkService {

	public static final String TOOL = "watermark";

	private final QuotaService quotaService;
	private final PdfWatermarkEngine watermarkEngine;
	private final PdfumiMetrics metrics;

	public WatermarkService(
			QuotaService quotaService,
			PdfWatermarkEngine watermarkEngine,
			PdfumiMetrics metrics
	) {
		this.quotaService = quotaService;
		this.watermarkEngine = watermarkEngine;
		this.metrics = metrics;
	}

	public byte[] apply(
			ClientContext client,
			MultipartFile file,
			String text,
			float xRatio,
			float yRatio,
			float rotationDeg
	) {
		long started = System.nanoTime();
		try {
			if (file == null || file.isEmpty()) {
				throw new BadRequestException("File PDF wajib diisi");
			}
			long maxBytes = client.entitlements().maxFileSizeBytes();
			int maxMb = client.entitlements().maxFileSizeMb();
			if (file.getSize() > maxBytes) {
				throw new BadRequestException("Ukuran file melebihi batas " + maxMb + "MB untuk paket " + client.plan().name());
			}
			byte[] pdf = watermarkEngine.apply(file, text, xRatio, yRatio, rotationDeg);
			quotaService.consume(client, TOOL);
			metrics.recordSuccess(TOOL);
			return pdf;
		} catch (QuotaExceededException ex) {
			metrics.recordFailure(TOOL, "quota");
			throw ex;
		} catch (BadRequestException ex) {
			metrics.recordFailure(TOOL, "validation");
			throw ex;
		} catch (RuntimeException ex) {
			metrics.recordFailure(TOOL, "error");
			throw ex;
		} finally {
			metrics.recordDuration(TOOL, started);
		}
	}
}
