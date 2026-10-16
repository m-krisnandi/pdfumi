package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.domain.PlanEntitlements;

import java.util.UUID;

public record ClientContext(
		String quotaKey,
		Plan plan,
		UUID accountId,
		String email,
		PlanEntitlements customEntitlements
) {
	public static ClientContext anonymous(String ipOrForwarded) {
		String safe = (ipOrForwarded == null || ipOrForwarded.isBlank()) ? "unknown" : ipOrForwarded.trim();
		return new ClientContext("anon:" + safe, Plan.FREE, null, null, null);
	}

	public static ClientContext forAccount(UUID accountId, String email, Plan plan) {
		return new ClientContext("acct:" + accountId, plan == null ? Plan.FREE : plan, accountId, email, null);
	}

	public static ClientContext forAccount(UUID accountId, String email, Plan plan, PlanEntitlements entitlements) {
		return new ClientContext("acct:" + accountId, plan == null ? Plan.FREE : plan, accountId, email, entitlements);
	}

	public PlanEntitlements entitlements() {
		return customEntitlements != null ? customEntitlements : plan.entitlements();
	}

	public boolean brandFooter() {
		return entitlements().brandFooter();
	}

	public boolean isAuthenticated() {
		return accountId != null;
	}
}
