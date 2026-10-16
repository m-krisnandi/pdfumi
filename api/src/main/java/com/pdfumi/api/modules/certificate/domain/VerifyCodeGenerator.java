package com.pdfumi.api.modules.certificate.domain;

import java.security.SecureRandom;

/**
 * Generates short, unambiguous verification codes for QR / public lookup.
 */
public final class VerifyCodeGenerator {

	private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
	private static final SecureRandom RANDOM = new SecureRandom();

	private VerifyCodeGenerator() {
	}

	public static String next() {
		StringBuilder sb = new StringBuilder(12);
		for (int i = 0; i < 12; i++) {
			if (i > 0 && i % 4 == 0) {
				sb.append('-');
			}
			sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
		}
		return sb.toString();
	}
}
