package com.vpertz.admin;

import com.vpertz.admin.dto.AdminModerationDtos.ReportView;
import com.vpertz.admin.dto.AdminModerationDtos.ReviewRequest;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.listings.ListingService;
import com.vpertz.listings.dto.ListingFilter;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.PageResponse;
import com.vpertz.reports.Report;
import com.vpertz.reports.ReportRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminModerationService {
    private static final Set<String> REPORT_STATUS = Set.of("aberta", "resolvida", "rejeitada");
    private static final Set<String> LISTING_STATUS = Set.of("ativo", "pausado", "vendido", "removido");
    private final ReportRepository reports;
    private final ListingService listings;

    public AdminModerationService(ReportRepository reports, ListingService listings) {
        this.reports = reports;
        this.listings = listings;
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportView> reports(String status, int page, int size) {
        String normalized = normalizeReportStatus(status, true);
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.desc("createdAt")));
        Page<Report> result = normalized == null
                ? reports.findAll(pageable)
                : reports.findByStatus(normalized, pageable);
        return PageResponse.from(result.map(AdminModerationService::view));
    }

    @Transactional
    public ReportView review(String id, ReviewRequest request, AuthPrincipal principal) {
        String status = normalizeReportStatus(request.status(), false);
        Report report = reports.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Denúncia não encontrada."));
        report.setStatus(status);
        report.setResolutionNote(clean(request.note(), 600));
        report.setReviewedBy(principal.userId());
        report.setReviewedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return view(reports.save(report));
    }

    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> listings(
            String query, String status, String sort, int page, int size) {
        String normalized = normalizeListingStatus(status);
        ListingFilter filter = new ListingFilter(
                query, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null,
                normalized);
        return listings.list(filter, sort, page, size);
    }

    @Transactional
    public ListingResponse updateListingStatus(String publicId, String status, AuthPrincipal principal) {
        String normalized = normalizeListingStatus(status);
        if (normalized == null) {
            throw new ValidationException("Selecione um status de anúncio.");
        }
        return listings.updateStatusAsAdmin(publicId, normalized, principal);
    }

    private static String normalizeReportStatus(String value, boolean allowAll) {
        String status = value == null ? "" : value.trim().toLowerCase();
        if (allowAll && (status.isEmpty() || "todas".equals(status))) return null;
        if (!REPORT_STATUS.contains(status)) throw new ValidationException("Status de denúncia inválido.");
        return status;
    }

    private static String normalizeListingStatus(String value) {
        String status = value == null ? "" : value.trim().toLowerCase();
        if (status.isEmpty() || "todos".equals(status)) return null;
        if (!LISTING_STATUS.contains(status)) throw new ValidationException("Status de anúncio inválido.");
        return status;
    }

    private static String clean(String value, int max) {
        if (value == null || value.isBlank()) return null;
        String clean = value.replaceAll("<[^>]*>", "").replace("<", "").replace(">", "").trim();
        return clean.substring(0, Math.min(clean.length(), max));
    }

    private static ReportView view(Report report) {
        return new ReportView(
                report.getId(), report.getAdId(), report.getTitle(), report.getSeller(),
                report.getReason(), report.getDetails(), report.getReporterId(), report.getStatus(),
                report.getCreatedAt(), report.getReviewedBy(), report.getReviewedAt(),
                report.getResolutionNote());
    }
}
