package com.pdfumi.api.shared;

import java.util.Base64;
import java.util.Locale;

public final class ImageBase64Decoder {

	private ImageBase64Decoder() {
	}

	public static byte[] decode(String raw) {
		if (raw == null || raw.isBlank()) {
			return null;
		}
		String value = raw.trim();
		int comma = value.indexOf(',');
		if (value.toLowerCase(Locale.ROOT).startsWith("data:") && comma > 0) {
			value = value.substring(comma + 1);
		}
		try {
			byte[] bytes = Base64.getDecoder().decode(value);
			if (bytes.length == 0 || bytes.length > 900_000) {
				return null;
			}
			return bytes;
		} catch (IllegalArgumentException ex) {
			return null;
		}
	}
}
