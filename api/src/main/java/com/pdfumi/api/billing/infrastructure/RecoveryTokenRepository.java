package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RecoveryTokenRepository extends JpaRepository<RecoveryTokenEntity, UUID> {
	Optional<RecoveryTokenEntity> findByTokenHashAndUsedAtIsNull(String tokenHash);

	long countByAccountIdAndCreatedAtAfter(UUID accountId, Instant after);
}
