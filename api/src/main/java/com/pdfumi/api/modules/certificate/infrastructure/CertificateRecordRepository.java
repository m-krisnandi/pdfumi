package com.pdfumi.api.modules.certificate.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CertificateRecordRepository extends JpaRepository<CertificateRecordEntity, UUID> {

	boolean existsByVerifyCode(String verifyCode);

	@Query("select r from CertificateRecordEntity r join fetch r.batch where r.verifyCode = :code")
	Optional<CertificateRecordEntity> findByVerifyCodeWithBatch(@Param("code") String code);
}
