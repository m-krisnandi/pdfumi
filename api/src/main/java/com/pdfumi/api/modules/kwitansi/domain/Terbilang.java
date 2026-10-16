package com.pdfumi.api.modules.kwitansi.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Terbilang {

	private static final String[] SATUAN = {
			"", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
			"sepuluh", "sebelas"
	};

	private Terbilang() {
	}

	public static String dari(BigDecimal amount) {
		if (amount == null) {
			return "";
		}
		long nilai = amount.setScale(0, RoundingMode.HALF_UP).longValue();
		if (nilai == 0) {
			return "Nol rupiah";
		}
		if (nilai < 0) {
			return "Minus " + dari(BigDecimal.valueOf(-nilai));
		}
		return capitalize(terbilang(nilai)) + " rupiah";
	}

	private static String terbilang(long n) {
		if (n < 12) {
			return SATUAN[(int) n];
		}
		if (n < 20) {
			return terbilang(n - 10) + " belas";
		}
		if (n < 100) {
			return terbilang(n / 10) + " puluh" + space(terbilang(n % 10));
		}
		if (n < 200) {
			return "seratus" + space(terbilang(n - 100));
		}
		if (n < 1000) {
			return terbilang(n / 100) + " ratus" + space(terbilang(n % 100));
		}
		if (n < 2000) {
			return "seribu" + space(terbilang(n - 1000));
		}
		if (n < 1_000_000) {
			return terbilang(n / 1000) + " ribu" + space(terbilang(n % 1000));
		}
		if (n < 1_000_000_000) {
			return terbilang(n / 1_000_000) + " juta" + space(terbilang(n % 1_000_000));
		}
		if (n < 1_000_000_000_000L) {
			return terbilang(n / 1_000_000_000) + " miliar" + space(terbilang(n % 1_000_000_000));
		}
		return terbilang(n / 1_000_000_000_000L) + " triliun" + space(terbilang(n % 1_000_000_000_000L));
	}

	private static String space(String s) {
		return s.isBlank() ? "" : " " + s;
	}

	private static String capitalize(String s) {
		if (s == null || s.isBlank()) {
			return s;
		}
		return Character.toUpperCase(s.charAt(0)) + s.substring(1);
	}
}