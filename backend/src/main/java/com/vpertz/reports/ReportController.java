package com.vpertz.reports;

import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.reports.dto.ReportDtos.ReportRequest;
import com.vpertz.reports.dto.ReportDtos.ReportResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Denúncia de anúncios (autenticado). */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<ReportResponse> create(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody ReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(principal.userId(), request));
    }
}
