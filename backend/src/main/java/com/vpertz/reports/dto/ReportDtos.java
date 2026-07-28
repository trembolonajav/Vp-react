package com.vpertz.reports.dto;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record ReportRequest(
            String adId,
            String title,
            String seller,
            String reason,
            String details) {
    }

    public record ReportResponse(String id) {
    }
}
