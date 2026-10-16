package com.pdfumi.api.quota;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.billing.domain.PlanEntitlements;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory quota for tests / fallback. Production uses {@link DbQuotaService}.
 */
public class InMemoryQuotaService implements QuotaService {

	private final ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();

	@Override
	public void consume(ClientContext client, String tool) {
		PlanEntitlements e = client.entitlements();
		if (e.usesMonthlyQuota()) {
			String key = client.quotaKey() + ":M:" + YearMonth.now() + ":*";
			int used = counters.computeIfAbsent(key, ignored -> new AtomicInteger()).incrementAndGet();
			if (used > e.monthlySharedLimit()) {
				throw new QuotaExceededException(
						"Monthly quota exhausted (" + e.monthlySharedLimit() + "). Upgrade or wait for the next cycle."
				);
			}
			return;
		}
		String key = client.quotaKey() + ":D:" + LocalDate.now() + ":" + tool;
		int used = counters.computeIfAbsent(key, ignored -> new AtomicInteger()).incrementAndGet();
		if (used > e.dailyLimitPerTool()) {
			throw new QuotaExceededException(
					"Daily free quota for " + tool + " exhausted (" + e.dailyLimitPerTool() + "/day). Upgrade to Pro."
			);
		}
	}

	@Override
	public Map<String, Object> status(ClientContext client, String tool) {
		PlanEntitlements e = client.entitlements();
		if (e.usesMonthlyQuota()) {
			String key = client.quotaKey() + ":M:" + YearMonth.now() + ":*";
			AtomicInteger counter = counters.get(key);
			int used = counter == null ? 0 : counter.get();
			return Map.of(
					"tool", tool,
					"period", "monthly",
					"plan", client.plan().name(),
					"used", used,
					"limit", e.monthlySharedLimit(),
					"remaining", Math.max(0, e.monthlySharedLimit() - used)
			);
		}
		String key = client.quotaKey() + ":D:" + LocalDate.now() + ":" + tool;
		AtomicInteger counter = counters.get(key);
		int used = counter == null ? 0 : counter.get();
		return Map.of(
				"tool", tool,
				"period", "daily",
				"plan", client.plan().name(),
				"used", used,
				"limit", e.dailyLimitPerTool(),
				"remaining", Math.max(0, e.dailyLimitPerTool() - used)
		);
	}
}
