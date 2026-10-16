package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCodeEntity, String> {

	Optional<PromoCodeEntity> findByCodeIgnoreCase(String code);

	List<PromoCodeEntity> findAllByOrderByCreatedAtDesc();
}
