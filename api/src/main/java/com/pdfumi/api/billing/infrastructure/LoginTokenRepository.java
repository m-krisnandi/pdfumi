package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface LoginTokenRepository extends JpaRepository<LoginTokenEntity, UUID> {
	Optional<LoginTokenEntity> findByTokenHashAndUsedAtIsNull(String tokenHash);

	long countByAccountIdAndCreatedAtAfter(UUID accountId, Instant after);
}
