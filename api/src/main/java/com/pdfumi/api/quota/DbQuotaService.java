package com.pdfumi.api.quota;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.billing.domain.PlanEntitlements;
import com.pdfumi.api.billing.infrastructure.UsageCounterEntity;
import com.pdfumi.api.billing.infrastructure.UsageCounterRepository;
import com.pdfumi.api.shared.exception.QuotaExceededException;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;

@Service
@Primary
public class DbQuotaService implements QuotaService {

	private static final String DAILY = "DAILY";
	private static final String MONTHLY = "MONTHLY";
	private static final String SHARED_TOOL = "*";

	private final UsageCounterRepository usageCounterRepository;

	public DbQuotaService(UsageCounterRepository usageCounterRepository) {
		this.usageCounterRepository = usageCounterRepository;
	}

	@Override
	@Transactional
	public void consume(ClientContext client, String tool) {
		PlanEntitlements e = client.entitlements();
		if (e.usesMonthlyQuota()) {
			int used = bump(client.quotaKey(), MONTHLY, YearMonth.now().toString(), SHARED_TOOL);
			if (used > e.monthlySharedLimit()) {
				throw new QuotaExceededException(
						"Monthly quota exhausted (" + e.monthlySharedLimit() + "). Upgrade or wait for the next cycle."
				);
			}
			return;
		}
		int used = bump(client.quotaKey(), DAILY, LocalDate.now().toString(), tool);
		if (used > e.dailyLimitPerTool()) {
			throw new QuotaExceededException(
					"Daily free quota for " + tool + " exhausted (" + e.dailyLimitPerTool() + "/day). Upgrade to Pro."
			);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> status(ClientContext client, String tool) {
		PlanEntitlements e = client.entitlements();
		if (e.usesMonthlyQuota()) {
			int used = read(client.quotaKey(), MONTHLY, YearMonth.now().toString(), SHARED_TOOL);
			return Map.of(
					"tool", tool,
					"period", "monthly",
					"plan", client.plan().name(),
					"used", used,
					"limit", e.monthlySharedLimit(),
					"remaining", Math.max(0, e.monthlySharedLimit() - used)
			);
		}
		int used = read(client.quotaKey(), DAILY, LocalDate.now().toString(), tool);
		return Map.of(
				"tool", tool,
				"period", "daily",
				"plan", client.plan().name(),
				"used", used,
				"limit", e.dailyLimitPerTool(),
				"remaining", Math.max(0, e.dailyLimitPerTool() - used)
		);
	}

	private int bump(String quotaKey, String periodType, String periodKey, String tool) {
		UsageCounterEntity row = usageCounterRepository
				.findByQuotaKeyAndPeriodTypeAndPeriodKeyAndTool(quotaKey, periodType, periodKey, tool)
				.orElseGet(() -> usageCounterRepository.save(
						new UsageCounterEntity(quotaKey, periodType, periodKey, tool)
				));
		int used = row.increment();
		usageCounterRepository.save(row);
		return used;
	}

	private int read(String quotaKey, String periodType, String periodKey, String tool) {
		return usageCounterRepository
				.findByQuotaKeyAndPeriodTypeAndPeriodKeyAndTool(quotaKey, periodType, periodKey, tool)
				.map(UsageCounterEntity::getUsedCount)
				.orElse(0);
	}
}
