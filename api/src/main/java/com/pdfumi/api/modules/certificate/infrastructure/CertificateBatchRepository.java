package com.pdfumi.api.modules.certificate.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CertificateBatchRepository extends JpaRepository<CertificateBatchEntity, UUID> {
}
