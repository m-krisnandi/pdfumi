package com.pdfumi.api.billing.infrastructure;

import com.pdfumi.api.billing.domain.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<AccountEntity, UUID> {
	Optional<AccountEntity> findByEmailIgnoreCase(String email);

	List<AccountEntity> findAllByOrderByCreatedAtDesc();

	long countByPlan(Plan plan);
}
