package com.pdfumi.api.feedback.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackReportRepository extends JpaRepository<FeedbackReportEntity, UUID> {

	List<FeedbackReportEntity> findAllByOrderByCreatedAtDesc();

	List<FeedbackReportEntity> findByCategoryOrderByCreatedAtDesc(String category);

	List<FeedbackReportEntity> findByStatusOrderByCreatedAtDesc(String status);
}
