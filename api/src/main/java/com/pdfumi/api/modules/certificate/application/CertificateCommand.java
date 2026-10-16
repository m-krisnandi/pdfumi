package com.pdfumi.api.modules.certificate.application;

import com.pdfumi.api.modules.certificate.domain.CertificateTemplate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CertificateCommand(
		@NotBlank @Size(max = 255) String eventTitle,
		@Size(max = 255) String organization,
		@Size(max = 64) String eventDate,
		@Size(max = 32) String template,
		@Size(max = 120) String heading,
		@Size(max = 200) String certifyLine,
		@Size(max = 200) String participatedLine,
		@Size(max = 1_500_000) String logoBase64,
		@NotEmpty @Valid List<RecipientCommand> recipients,
		@Valid @Size(max = 3) List<SignerCommand> signers,
		Boolean withBrandFooter
) {
	public boolean brandFooterEnabled() {
		return false;
	}

	public CertificateTemplate resolvedTemplate() {
		return CertificateTemplate.from(template);
	}

	public String resolvedHeading() {
		return blankOr(heading, "CERTIFICATE OF COMPLETION");
	}

	public String resolvedCertifyLine() {
		return blankOr(certifyLine, "This is to certify that");
	}

	public String resolvedParticipatedLine() {
		return blankOr(participatedLine, "has successfully participated in");
	}

	private static String blankOr(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value.trim();
	}

	public record RecipientCommand(
			@NotBlank @Size(max = 255) String name,
			@Size(max = 255) String title
	) {
	}

	public record SignerCommand(
			@NotBlank @Size(max = 255) String name,
			@Size(max = 255) String title,
			@Size(max = 1_500_000) String signatureBase64
	) {
	}
}
