package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricingPlanRepository extends JpaRepository<PricingPlanEntity, String> {

	List<PricingPlanEntity> findByActiveTrueOrderByPriceIdrAsc();

	List<PricingPlanEntity> findAllByOrderByPriceIdrAsc();
}
