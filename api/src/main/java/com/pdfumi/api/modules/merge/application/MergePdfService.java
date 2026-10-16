package com.pdfumi.api.modules.merge.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class MergePdfService {

	public static final String TOOL = "merge";

	private final QuotaService quotaService;
	private final PdfMergeEngine mergeEngine;
	private final PdfumiMetrics metrics;

	public MergePdfService(QuotaService quotaService, PdfMergeEngine mergeEngine, PdfumiMetrics metrics) {
		this.quotaService = quotaService;
		this.mergeEngine = mergeEngine;
		this.metrics = metrics;
	}

	public byte[] merge(ClientContext client, List<MultipartFile> files) {
		long started = System.nanoTime();
		try {
			validate(client, files);
			byte[] pdf = mergeEngine.merge(files);
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

	private void validate(ClientContext client, List<MultipartFile> files) {
		if (files == null || files.size() < 2) {
			throw new BadRequestException("Minimal 2 file PDF");
		}
		int maxFiles = client.entitlements().maxBatchFiles();
		if (files.size() > maxFiles) {
			throw new BadRequestException("Maksimal " + maxFiles + " file untuk paket " + client.plan().name());
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
		}
	}
}
