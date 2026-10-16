package com.pdfumi.api.modules.certificate.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VerifyCodeGeneratorTest {

	@Test
	void producesFormattedTwelveCharacterCodes() {
		String code = VerifyCodeGenerator.next();
		assertEquals(14, code.length());
		assertTrue(code.matches("[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}"));
	}
}
