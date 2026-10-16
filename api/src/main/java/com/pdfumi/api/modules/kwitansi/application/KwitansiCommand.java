package com.pdfumi.api.modules.kwitansi.application;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record KwitansiCommand(
		String nomor,
		@NotBlank String diterimaDari,
		@NotNull @DecimalMin("1") BigDecimal jumlah,
		@NotBlank String untukPembayaran,
		String kota,
		String tanggal,
		String penerimaNama,
		String organization,
		@Size(max = 1_500_000) String logoBase64,
		@Size(max = 1_500_000) String signatureBase64,
		Boolean withBrandFooter
) {
	public boolean brandFooterEnabled() {
		return withBrandFooter == null || withBrandFooter;
	}
}
