package com.pdfumi.api.modules.kwitansi.application;

public interface KwitansiPdfGenerator {
	byte[] generate(KwitansiCommand command, byte[] logoImage, byte[] signatureImage);
}
