package com.pdfumi.api.modules.certificate.application;

import java.time.Instant;

public record CertificateVerifyResult(
		boolean valid,
		String verifyCode,
		String recipientName,
		String recipientTitle,
		String eventTitle,
		String organization,
		String eventDate,
		Instant issuedAt
) {
}
