package com.pdfumi.api.modules.kwitansi.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.ImageBase64Decoder;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class KwitansiService {

	public static final String TOOL = "kwitansi";

	private final QuotaService quotaService;
	private final KwitansiPdfGenerator pdfGenerator;
	private final PdfumiMetrics metrics;

	public KwitansiService(
			QuotaService quotaService,
			KwitansiPdfGenerator pdfGenerator,
			PdfumiMetrics metrics
	) {
		this.quotaService = quotaService;
		this.pdfGenerator = pdfGenerator;
		this.metrics = metrics;
	}

	public byte[] create(ClientContext client, KwitansiCommand command) {
		long started = System.nanoTime();
		try {
			quotaService.consume(client, TOOL);
			byte[] pdf = render(withBrandFooter(command, client.brandFooter()));
			metrics.recordSuccess(TOOL);
			return pdf;
		} catch (QuotaExceededException ex) {
			metrics.recordFailure(TOOL, "quota");
			throw ex;
		} catch (RuntimeException ex) {
			metrics.recordFailure(TOOL, "error");
			throw ex;
		} finally {
			metrics.recordDuration(TOOL, started);
		}
	}

	/** Preview does not consume quota; always shows free-tier footer look. */
	public byte[] preview(KwitansiCommand command) {
		return render(withBrandFooter(command, true));
	}

	public Map<String, Object> quota(ClientContext client) {
		return quotaService.status(client, TOOL);
	}

	private byte[] render(KwitansiCommand command) {
		return pdfGenerator.generate(
				command,
				ImageBase64Decoder.decode(command.logoBase64()),
				ImageBase64Decoder.decode(command.signatureBase64())
		);
	}

	private static KwitansiCommand withBrandFooter(KwitansiCommand command, boolean footer) {
		return new KwitansiCommand(
				command.nomor(),
				command.diterimaDari(),
				command.jumlah(),
				command.untukPembayaran(),
				command.kota(),
				command.tanggal(),
				command.penerimaNama(),
				command.organization(),
				command.logoBase64(),
				command.signatureBase64(),
				footer
		);
	}
}
