package com.pdfumi.api.modules.kwitansi.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TerbilangTest {

	@Test
	void convertsCommonAmount() {
		assertEquals("Seratus lima puluh ribu rupiah", Terbilang.dari(new BigDecimal("150000")));
	}

	@Test
	void convertsZero() {
		assertEquals("Nol rupiah", Terbilang.dari(BigDecimal.ZERO));
	}
}