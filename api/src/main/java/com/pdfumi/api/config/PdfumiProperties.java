package com.pdfumi.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pdfumi")
public record PdfumiProperties(
		String corsOrigins,
		String brandFooter,
		String publicWebBase,
		String publicApiBase,
		Integer tempTtlHours,
		Free free,
		Security security,
		Tripay tripay,
		Midtrans midtrans,
		Mail mail,
		Office office
) {
	public record Free(Integer dailyLimit, Integer certificateMaxRecipients) {
	}

	public record Security(
			String actuatorUser,
			String actuatorPassword,
			Boolean swaggerEnabled
	) {
	}

	public record Tripay(
			String apiKey,
			String privateKey,
			String merchantCode,
			String mode,
			Integer pricePassIdr,
			Integer priceProIdr,
			Integer priceBusinessIdr
	) {
	}

	public record Midtrans(
			String merchantId,
			String clientKey,
			String serverKey,
			String mode
	) {
	}

	public record Mail(
			String from,
			Boolean exposeDevLink
	) {
	}

	public record Office(String sofficePath, Integer timeoutSeconds) {
	}

	public String[] corsOriginList() {
		if (corsOrigins == null || corsOrigins.isBlank()) {
			return new String[]{"http://localhost:3000"};
		}
		return corsOrigins.split("\\s*,\\s*");
	}

	public int dailyLimit() {
		if (free == null || free.dailyLimit() == null) {
			return 5;
		}
		return free.dailyLimit();
	}

	public int certificateMaxRecipients() {
		if (free == null || free.certificateMaxRecipients() == null) {
			return 20;
		}
		return free.certificateMaxRecipients();
	}

	public String publicWebBaseUrl() {
		if (publicWebBase == null || publicWebBase.isBlank()) {
			return "http://localhost:3000";
		}
		return publicWebBase.replaceAll("/$", "");
	}

	public String publicApiBaseUrl() {
		if (publicApiBase == null || publicApiBase.isBlank()) {
			return "http://localhost:8080";
		}
		return publicApiBase.replaceAll("/$", "");
	}

	public String loginLink(String locale, String token) {
		String loc = (locale == null || locale.isBlank()) ? "en" : locale;
		return publicWebBaseUrl() + "/" + loc + "/account/login?token=" + token;
	}

	public String recoveryLink(String locale, String token) {
		String loc = (locale == null || locale.isBlank()) ? "en" : locale;
		return publicWebBaseUrl() + "/" + loc + "/account/recover?token=" + token;
	}

	public boolean exposeDevRecoveryLink() {
		return exposeDevLink();
	}

	public boolean swaggerEnabled() {
		return security == null || security.swaggerEnabled() == null || security.swaggerEnabled();
	}

	public String actuatorUser() {
		return security == null || security.actuatorUser() == null || security.actuatorUser().isBlank()
				? "actuator"
				: security.actuatorUser();
	}

	public String actuatorPassword() {
		return security == null || security.actuatorPassword() == null || security.actuatorPassword().isBlank()
				? "changeme"
				: security.actuatorPassword();
	}

	public boolean tripayEnabled() {
		return tripay != null
				&& tripay.apiKey() != null && !tripay.apiKey().isBlank()
				&& tripay.privateKey() != null && !tripay.privateKey().isBlank()
				&& tripay.merchantCode() != null && !tripay.merchantCode().isBlank();
	}

	public String tripayApiKey() {
		return tripay == null ? "" : nullToEmpty(tripay.apiKey());
	}

	public String tripayPrivateKey() {
		return tripay == null ? "" : nullToEmpty(tripay.privateKey());
	}

	public String tripayMerchantCode() {
		return tripay == null ? "" : nullToEmpty(tripay.merchantCode());
	}

	public String tripayMode() {
		return (tripay != null && "production".equalsIgnoreCase(tripay.mode())) ? "production" : "sandbox";
	}

	public String tripayBaseUrl() {
		return "production".equalsIgnoreCase(tripayMode())
				? "https://tripay.co.id/api"
				: "https://tripay.co.id/api-sandbox";
	}


	public boolean midtransEnabled() {
		return midtrans != null
				&& midtrans.serverKey() != null && !midtrans.serverKey().isBlank();
	}

	public String midtransMerchantId() {
		return midtrans == null ? "" : nullToEmpty(midtrans.merchantId());
	}

	public String midtransClientKey() {
		return midtrans == null ? "" : nullToEmpty(midtrans.clientKey());
	}

	public String midtransServerKey() {
		return midtrans == null ? "" : nullToEmpty(midtrans.serverKey());
	}

	public String midtransMode() {
		return (midtrans != null && "sandbox".equalsIgnoreCase(midtrans.mode())) ? "sandbox" : "production";
	}

	public String midtransSnapUrl() {
		return "sandbox".equalsIgnoreCase(midtransMode())
				? "https://app.sandbox.midtrans.com/snap/v1/transactions"
				: "https://app.midtrans.com/snap/v1/transactions";
	}

	public int pricePassIdr() {
		if (tripay == null || tripay.pricePassIdr() == null || tripay.pricePassIdr() < 1000) {
			return 19000;
		}
		return tripay.pricePassIdr();
	}

	public int priceProIdr() {
		if (tripay == null || tripay.priceProIdr() == null || tripay.priceProIdr() < 1000) {
			return 29000;
		}
		return tripay.priceProIdr();
	}

	public int priceBusinessIdr() {
		if (tripay == null || tripay.priceBusinessIdr() == null || tripay.priceBusinessIdr() < 1000) {
			return 149000;
		}
		return tripay.priceBusinessIdr();
	}

	public String mailFrom() {
		return mail == null || mail.from() == null || mail.from().isBlank()
				? "no-reply@pdfumi.com"
				: mail.from();
	}

	public boolean exposeDevLink() {
		return mail != null && Boolean.TRUE.equals(mail.exposeDevLink());
	}

	public String sofficePath() {
		return office == null || office.sofficePath() == null || office.sofficePath().isBlank()
				? "soffice"
				: office.sofficePath();
	}

	public int officeTimeoutSeconds() {
		return office == null || office.timeoutSeconds() == null || office.timeoutSeconds() <= 0
				? 120
				: office.timeoutSeconds();
	}



	private static String nullToEmpty(String s) {
		return s == null ? "" : s.trim();
	}
}
