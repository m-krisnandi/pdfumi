package com.pdfumi.api.modules.certificate.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.certificate.domain.VerifyCodeGenerator;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateBatchEntity;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateBatchRepository;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateRecordEntity;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateRecordRepository;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CertificateService {

	public static final String TOOL = "certificate";

	private final QuotaService quotaService;
	private final CertificatePdfGenerator pdfGenerator;
	private final CertificateBatchRepository batchRepository;
	private final CertificateRecordRepository recordRepository;
	private final PdfumiProperties properties;
	private final PdfumiMetrics metrics;

	public CertificateService(
			QuotaService quotaService,
			CertificatePdfGenerator pdfGenerator,
			CertificateBatchRepository batchRepository,
			CertificateRecordRepository recordRepository,
			PdfumiProperties properties,
			PdfumiMetrics metrics
	) {
		this.quotaService = quotaService;
		this.pdfGenerator = pdfGenerator;
		this.batchRepository = batchRepository;
		this.recordRepository = recordRepository;
		this.properties = properties;
		this.metrics = metrics;
	}

	@Transactional
	public byte[] create(ClientContext client, CertificateCommand command) {
		long started = System.nanoTime();
		try {
			List<CertificateCommand.RecipientCommand> recipients = sanitizeRecipients(command.recipients());
			ensureWithinLimit(client, recipients.size());
			List<CertificatePdfGenerator.Signer> signers = sanitizeSigners(command.signers());

			quotaService.consume(client, TOOL);

			Instant now = Instant.now();
			CertificateBatchEntity batch = new CertificateBatchEntity(
					UUID.randomUUID(),
					command.eventTitle().trim(),
					blankToNull(command.organization()),
					blankToNull(command.eventDate()),
					now
			);
			batchRepository.save(batch);

			List<CertificatePdfGenerator.Page> pages = new ArrayList<>(recipients.size());
			for (CertificateCommand.RecipientCommand recipient : recipients) {
				String code = uniqueVerifyCode();
				CertificateRecordEntity record = new CertificateRecordEntity(
						UUID.randomUUID(),
						batch,
						code,
						recipient.name().trim(),
						blankToNull(recipient.title()),
						now
				);
				recordRepository.save(record);
				pages.add(new CertificatePdfGenerator.Page(
						record.getRecipientName(),
						record.getRecipientTitle(),
						code,
						verifyUrl(code)
				));
			}

			byte[] pdf = pdfGenerator.generate(toRenderModel(command, signers, pages));
			metrics.recordSuccess(TOOL);
			return pdf;
		} catch (QuotaExceededException | BadRequestException ex) {
			metrics.recordFailure(TOOL, ex instanceof QuotaExceededException ? "quota" : "bad_request");
			throw ex;
		} catch (RuntimeException ex) {
			metrics.recordFailure(TOOL, "error");
			throw ex;
		} finally {
			metrics.recordDuration(TOOL, started);
		}
	}

	/**
	 * Preview first recipient page only — no quota consume, no DB writes.
	 */
	public byte[] preview(CertificateCommand command) {
		List<CertificateCommand.RecipientCommand> recipients = sanitizeRecipients(command.recipients());
		ensureWithinLimit(ClientContext.anonymous("preview"), recipients.size());
		List<CertificatePdfGenerator.Signer> signers = sanitizeSigners(command.signers());

		CertificateCommand.RecipientCommand first = recipients.getFirst();
		String previewCode = "PREVIEW-ONLY";
		List<CertificatePdfGenerator.Page> pages = List.of(new CertificatePdfGenerator.Page(
				first.name().trim(),
				blankToNull(first.title()),
				previewCode,
				properties.publicWebBaseUrl() + "/en/verify/" + previewCode
		));
		return pdfGenerator.generate(toRenderModel(command, signers, pages));
	}

	@Transactional(readOnly = true)
	public CertificateVerifyResult verify(String rawCode) {
		String code = normalizeCode(rawCode);
		CertificateRecordEntity record = recordRepository.findByVerifyCodeWithBatch(code)
				.orElseThrow(() -> new NotFoundException("Certificate not found for code " + code));
		CertificateBatchEntity batch = record.getBatch();
		return new CertificateVerifyResult(
				true,
				record.getVerifyCode(),
				record.getRecipientName(),
				record.getRecipientTitle(),
				batch.getEventTitle(),
				batch.getOrganization(),
				batch.getEventDate(),
				record.getCreatedAt()
		);
	}

	public Map<String, Object> quota(ClientContext client) {
		Map<String, Object> status = quotaService.status(client, TOOL);
		return Map.of(
				"tool", TOOL,
				"used", status.get("used"),
				"limit", status.get("limit"),
				"remaining", status.get("remaining"),
				"period", status.getOrDefault("period", "daily"),
				"plan", status.getOrDefault("plan", client.plan().name()),
				"maxRecipients", client.entitlements().certificateMaxRecipients()
		);
	}

	private CertificatePdfGenerator.CertificateRenderModel toRenderModel(
			CertificateCommand command,
			List<CertificatePdfGenerator.Signer> signers,
			List<CertificatePdfGenerator.Page> pages
	) {
		return new CertificatePdfGenerator.CertificateRenderModel(
				command.eventTitle().trim(),
				blankToNull(command.organization()),
				blankToNull(command.eventDate()),
				command.resolvedHeading(),
				command.resolvedCertifyLine(),
				command.resolvedParticipatedLine(),
				command.resolvedTemplate(),
				command.brandFooterEnabled(),
				SignatureImageDecoder.decode(command.logoBase64()),
				signers,
				pages
		);
	}

	private void ensureWithinLimit(ClientContext client, int size) {
		int max = client.entitlements().certificateMaxRecipients();
		if (size > max) {
			throw new BadRequestException(
					"Max " + max + " recipients for plan " + client.plan().name()
			);
		}
		if (size < 1) {
			throw new BadRequestException("At least one recipient is required");
		}
	}

	private String uniqueVerifyCode() {
		for (int attempt = 0; attempt < 12; attempt++) {
			String code = VerifyCodeGenerator.next();
			if (!recordRepository.existsByVerifyCode(code)) {
				return code;
			}
		}
		throw new IllegalStateException("Unable to allocate a unique verify code");
	}

	private String verifyUrl(String code) {
		return properties.publicWebBaseUrl() + "/en/verify/" + code;
	}

	private static List<CertificateCommand.RecipientCommand> sanitizeRecipients(
			List<CertificateCommand.RecipientCommand> recipients
	) {
		if (recipients == null || recipients.isEmpty()) {
			throw new BadRequestException("At least one recipient is required");
		}
		List<CertificateCommand.RecipientCommand> cleaned = new ArrayList<>();
		Set<String> seen = new HashSet<>();
		for (CertificateCommand.RecipientCommand recipient : recipients) {
			if (recipient == null || recipient.name() == null || recipient.name().isBlank()) {
				continue;
			}
			String name = recipient.name().trim();
			String title = blankToNull(recipient.title());
			String dedupeKey = name.toLowerCase(Locale.ROOT) + "|" + (title == null ? "" : title.toLowerCase(Locale.ROOT));
			if (!seen.add(dedupeKey)) {
				continue;
			}
			cleaned.add(new CertificateCommand.RecipientCommand(name, title));
		}
		if (cleaned.isEmpty()) {
			throw new BadRequestException("At least one valid recipient name is required");
		}
		return cleaned;
	}

	private static List<CertificatePdfGenerator.Signer> sanitizeSigners(
			List<CertificateCommand.SignerCommand> signers
	) {
		if (signers == null || signers.isEmpty()) {
			return List.of();
		}
		if (signers.size() > 3) {
			throw new BadRequestException("Maximum 3 signers allowed");
		}
		List<CertificatePdfGenerator.Signer> cleaned = new ArrayList<>();
		for (CertificateCommand.SignerCommand signer : signers) {
			if (signer == null || signer.name() == null || signer.name().isBlank()) {
				continue;
			}
			cleaned.add(new CertificatePdfGenerator.Signer(
					signer.name().trim(),
					blankToNull(signer.title()),
					SignatureImageDecoder.decode(signer.signatureBase64())
			));
		}
		return cleaned;
	}

	private static String normalizeCode(String rawCode) {
		if (rawCode == null || rawCode.isBlank()) {
			throw new BadRequestException("Verify code is required");
		}
		return rawCode.trim().toUpperCase(Locale.ROOT);
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
