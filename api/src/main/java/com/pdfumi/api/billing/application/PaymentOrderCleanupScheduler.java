package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.infrastructure.PaymentOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class PaymentOrderCleanupScheduler {

	private static final Logger log = LoggerFactory.getLogger(PaymentOrderCleanupScheduler.class);

	private final PaymentOrderRepository orderRepository;

	public PaymentOrderCleanupScheduler(PaymentOrderRepository orderRepository) {
		this.orderRepository = orderRepository;
	}

	/**
	 * Run every 30 minutes to mark expired unpaid QRIS orders.
	 */
	@Scheduled(cron = "0 */30 * * * *")
	@Transactional
	public void expireOverdueOrders() {
		Instant now = Instant.now();
		int expiredCount = orderRepository.expireOverdueOrders(now);
		if (expiredCount > 0) {
			log.info("Auto-expired {} unpaid QRIS payment orders past expiration time.", expiredCount);
		}
	}
}
