package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsageCounterRepository extends JpaRepository<UsageCounterEntity, Long> {
	Optional<UsageCounterEntity> findByQuotaKeyAndPeriodTypeAndPeriodKeyAndTool(
			String quotaKey,
			String periodType,
			String periodKey,
			String tool
	);
}
