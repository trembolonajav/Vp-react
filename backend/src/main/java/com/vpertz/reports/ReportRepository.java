package com.vpertz.reports;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportRepository extends JpaRepository<Report, String> {
    boolean existsByAdIdAndReporterIdAndStatus(String adId, String reporterId, String status);

    Page<Report> findByStatus(String status, Pageable pageable);
}
