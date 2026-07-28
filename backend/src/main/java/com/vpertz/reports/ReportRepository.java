package com.vpertz.reports;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, String> {
    boolean existsByAdIdAndReporterIdAndStatus(String adId, String reporterId, String status);
}
