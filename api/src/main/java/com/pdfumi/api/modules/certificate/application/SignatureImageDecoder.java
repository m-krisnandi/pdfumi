package com.pdfumi.api.modules.certificate.application;

import com.pdfumi.api.shared.ImageBase64Decoder;

final class SignatureImageDecoder {

	private SignatureImageDecoder() {
	}

	static byte[] decode(String raw) {
		return ImageBase64Decoder.decode(raw);
	}
}
