package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrderEntity, UUID> {

	Optional<PaymentOrderEntity> findByOrderReference(String orderReference);

	List<PaymentOrderEntity> findAllByOrderByCreatedAtDesc();

	List<PaymentOrderEntity> findByStatusOrderByCreatedAtDesc(String status);

	long countByStatus(String status);

	@Query("SELECT COALESCE(SUM(o.amount), 0) FROM PaymentOrderEntity o WHERE o.status = 'PAID'")
	long totalPaidRevenue();

	@Modifying
	@Query("UPDATE PaymentOrderEntity o SET o.status = 'EXPIRED' WHERE o.status = 'UNPAID' AND o.expiresAt < :now")
	int expireOverdueOrders(@Param("now") Instant now);
}
