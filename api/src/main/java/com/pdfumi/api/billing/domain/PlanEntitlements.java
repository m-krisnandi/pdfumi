package com.pdfumi.api.billing.domain;

public record PlanEntitlements(
		Plan plan,
		int dailyLimitPerTool,
		int monthlySharedLimit,
		boolean brandFooter,
		int maxApiKeys,
		int certificateMaxRecipients
) {
	public boolean usesDailyQuota() {
		return dailyLimitPerTool > 0;
	}

	public boolean usesMonthlyQuota() {
		return monthlySharedLimit > 0;
	}

	public int maxFileSizeMb() {
		return plan == Plan.FREE ? 20 : (plan == Plan.UNLIMITED ? 200 : 100);
	}

	public long maxFileSizeBytes() {
		return (long) maxFileSizeMb() * 1024L * 1024L;
	}

	public int maxBatchFiles() {
		return plan == Plan.FREE ? 20 : 100;
	}
}
