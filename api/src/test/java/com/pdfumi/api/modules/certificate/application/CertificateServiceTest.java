package com.pdfumi.api.modules.certificate.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateBatchRepository;
import com.pdfumi.api.modules.certificate.infrastructure.CertificateRecordRepository;
import com.pdfumi.api.modules.certificate.infrastructure.OpenPdfCertificateGenerator;
import com.pdfumi.api.modules.certificate.infrastructure.ZxingQrCodeEncoder;
import com.pdfumi.api.quota.InMemoryQuotaService;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

	@Mock
	private CertificateBatchRepository batchRepository;

	@Mock
	private CertificateRecordRepository recordRepository;

	private CertificateService service;

	@BeforeEach
	void setUp() {
		PdfumiProperties properties = new PdfumiProperties(
				"http://localhost:3000",
				"footer",
				"http://localhost:3000",
				"http://localhost:8080",
				24,
				new PdfumiProperties.Free(5, 20),
				new PdfumiProperties.Security("actuator", "secret", true),
				null,
				null,
				null,
				null
		);
		org.mockito.Mockito.lenient().when(batchRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		org.mockito.Mockito.lenient().when(recordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		org.mockito.Mockito.lenient().when(recordRepository.existsByVerifyCode(ArgumentMatchers.anyString())).thenReturn(false);

		service = new CertificateService(
				new InMemoryQuotaService(),
				new OpenPdfCertificateGenerator(new ZxingQrCodeEncoder()),
				batchRepository,
				recordRepository,
				properties,
				new PdfumiMetrics(new SimpleMeterRegistry())
		);
	}

	@Test
	void create_createsZipForMultipleRecipients() {
		CertificateCommand command = sampleCommand();
		byte[] pdf = service.create(ClientContext.anonymous("127.0.0.1"), command);
		assertThat(pdf).isNotEmpty();
		assertThat(pdf[0]).isEqualTo((byte) '%');
		assertThat(pdf[1]).isEqualTo((byte) 'P');
		assertThat(pdf[2]).isEqualTo((byte) 'D');
		assertThat(pdf[3]).isEqualTo((byte) 'F');
	}

	@Test
	void verify_returnsNotFoundWhenMissing() {
		org.mockito.Mockito.when(recordRepository.findByVerifyCodeWithBatch("UNKNOWN")).thenReturn(Optional.empty());
		assertThatThrownBy(() -> service.verify("UNKNOWN"))
				.isInstanceOf(NotFoundException.class);
	}

	private CertificateCommand sampleCommand() {
		return new CertificateCommand(
				"Workshop SOLID",
				"Pdfumi Academy",
				"29 September 2026",
				"classic",
				null,
				null,
				null,
				null,
				List.of(
						new CertificateCommand.RecipientCommand("Ada Lovelace", "Participant"),
						new CertificateCommand.RecipientCommand("Alan Turing", "Speaker")
				),
				List.of(
						new CertificateCommand.SignerCommand("Jane Doe", "Director", null)
				),
				false
		);
	}
}
