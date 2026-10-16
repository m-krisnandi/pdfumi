package com.pdfumi.api.modules.kwitansi.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.quota.InMemoryQuotaService;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KwitansiServiceTest {

	private KwitansiPdfGenerator generator;
	private KwitansiService service;

	@BeforeEach
	void setUp() {
		generator = mock(KwitansiPdfGenerator.class);
		when(generator.generate(any(), any(), any())).thenReturn("%PDF-1.4".getBytes());
		service = new KwitansiService(
				new InMemoryQuotaService(),
				generator,
				new PdfumiMetrics(new SimpleMeterRegistry())
		);
	}

	@Test
	void createsPdfWithinQuota() {
		byte[] pdf = service.create(ClientContext.anonymous("client-a"), sample());
		assertTrue(pdf.length > 0);
	}

	@Test
	void rejectsWhenQuotaExceeded() {
		var client = ClientContext.anonymous("client-b");
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		assertThrows(QuotaExceededException.class, () -> service.create(client, sample()));
	}

	@Test
	void previewDoesNotRequireQuota() {
		byte[] pdf = service.preview(sample());
		assertTrue(pdf.length > 0);
		var client = ClientContext.anonymous("client-c");
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		service.create(client, sample());
		assertTrue(service.preview(sample()).length > 0);
	}

	private static KwitansiCommand sample() {
		return new KwitansiCommand(
				"001",
				"Budi",
				new BigDecimal("150000"),
				"Jasa desain",
				"Jakarta",
				"28 September 2026",
				"Siti",
				"Pdfumi Academy",
				null,
				null,
				true
		);
	}
}
