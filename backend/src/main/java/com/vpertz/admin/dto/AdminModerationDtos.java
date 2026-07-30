package com.vpertz.admin.dto;

import java.time.OffsetDateTime;

public final class AdminModerationDtos {
    private AdminModerationDtos() {
    }

    public record ReportView(
            String id,
            String adId,
            String title,
            String seller,
            String reason,
            String details,
            String reporterId,
            String status,
            OffsetDateTime createdAt,
            String reviewedBy,
            OffsetDateTime reviewedAt,
            String resolutionNote) {
    }

    public record ReviewRequest(String status, String note) {
    }
}
