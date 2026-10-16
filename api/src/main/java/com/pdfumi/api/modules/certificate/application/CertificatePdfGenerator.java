package com.pdfumi.api.modules.certificate.application;

import com.pdfumi.api.modules.certificate.domain.CertificateTemplate;

import java.util.List;

public interface CertificatePdfGenerator {

	byte[] generate(CertificateRenderModel model);

	record CertificateRenderModel(
			String eventTitle,
			String organization,
			String eventDate,
			String heading,
			String certifyLine,
			String participatedLine,
			CertificateTemplate template,
			boolean brandFooterEnabled,
			byte[] logoImage,
			List<Signer> signers,
			List<Page> pages
	) {
	}

	record Page(
			String recipientName,
			String recipientTitle,
			String verifyCode,
			String verifyUrl
	) {
	}

	record Signer(
			String name,
			String title,
			byte[] signatureImage
	) {
	}
}
