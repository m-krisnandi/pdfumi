package com.pdfumi.api.billing.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "usage_counter",
		uniqueConstraints = @UniqueConstraint(
				name = "uq_usage_counter",
				columnNames = {"quota_key", "period_type", "period_key", "tool"}
		)
)
public class UsageCounterEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "quota_key", nullable = false, length = 160)
	private String quotaKey;

	@Column(name = "period_type", nullable = false, length = 16)
	private String periodType;

	@Column(name = "period_key", nullable = false, length = 32)
	private String periodKey;

	@Column(nullable = false, length = 64)
	private String tool;

	@Column(name = "used_count", nullable = false)
	private int usedCount;

	protected UsageCounterEntity() {
	}

	public UsageCounterEntity(String quotaKey, String periodType, String periodKey, String tool) {
		this.quotaKey = quotaKey;
		this.periodType = periodType;
		this.periodKey = periodKey;
		this.tool = tool;
		this.usedCount = 0;
	}

	public Long getId() {
		return id;
	}

	public int getUsedCount() {
		return usedCount;
	}

	public int increment() {
		this.usedCount += 1;
		return this.usedCount;
	}
}
