package com.pdfumi.api.billing.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKeyEntity, UUID> {
	Optional<ApiKeyEntity> findByKeyHashAndRevokedAtIsNull(String keyHash);

	List<ApiKeyEntity> findByAccountIdAndRevokedAtIsNullOrderByCreatedAtDesc(UUID accountId);

	long countByAccountIdAndRevokedAtIsNull(UUID accountId);
}
