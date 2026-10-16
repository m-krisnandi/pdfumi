package com.pdfumi.api.billing.domain;

/**
 * Commercial plans:
 * FREE: daily limit 5 docs, with brand footer.
 * PASS: 7-day Event Pass (150 docs, no watermark, Rp 19.000 / $2).
 * PRO: 30-day Pro (500 docs, no watermark, 1 API key, Rp 29.000 / $5).
 * BUSINESS: Annual / High Volume (6.000 docs/yr (500/mo parity), 5 API keys, Rp 149.000 / $15).
 * UNLIMITED: VIP / Unlimited plan (1.000.000 docs/mo, 50 API keys, no watermark).
 */
public enum Plan {
	FREE,
	PASS,
	PRO,
	BUSINESS,
	UNLIMITED;

	public PlanEntitlements entitlements() {
		return switch (this) {
			case FREE -> new PlanEntitlements(
					this,
					5,          // daily docs per tool (anonymous / free key)
					0,          // monthly shared (unused when daily applies)
					false,      // brand footer
					1,          // max API keys
					20          // certificate batch size
			);
			case PASS -> new PlanEntitlements(
					this,
					0,
					150,
					false,
					1,
					100
			);
			case PRO -> new PlanEntitlements(
					this,
					0,
					500,
					false,
					1,
					200
			);
			case BUSINESS -> new PlanEntitlements(
					this,
					0,
					6_000,
					false,
					5,
					500
			);
			case UNLIMITED -> new PlanEntitlements(
					this,
					0,
					1_000_000,
					false,
					50,
					10_000
			);
		};
	}

	public static Plan fromName(String raw) {
		if (raw == null || raw.isBlank()) {
			return FREE;
		}
		try {
			return Plan.valueOf(raw.trim().toUpperCase());
		} catch (IllegalArgumentException e) {
			return FREE;
		}
	}
}
