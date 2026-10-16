package com.pdfumi.api.modules.certificate.domain;

import java.util.Locale;

public enum CertificateTemplate {
	CLASSIC,
	MODERN,
	ELEGANT;

	public static CertificateTemplate from(String raw) {
		if (raw == null || raw.isBlank()) {
			return CLASSIC;
		}
		try {
			return CertificateTemplate.valueOf(raw.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException ex) {
			return CLASSIC;
		}
	}
}
