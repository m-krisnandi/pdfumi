package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WebSessionRepository extends JpaRepository<WebSessionEntity, UUID> {
	Optional<WebSessionEntity> findByTokenHashAndRevokedAtIsNull(String tokenHash);
}
