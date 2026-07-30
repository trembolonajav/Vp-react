package com.vpertz.reports;

import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.reports.dto.ReportDtos.ReportRequest;
import com.vpertz.reports.dto.ReportDtos.ReportResponse;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ListingRepository listingRepository;

    public ReportService(ReportRepository reportRepository, ListingRepository listingRepository) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
    }

    @Transactional
    public ReportResponse create(String reporterId, ReportRequest req) {
        String adId = clean(req.adId(), 80);
        String reason = clean(req.reason(), 100);
        if (adId.isEmpty() || reason.isEmpty()) {
            throw new ValidationException("Selecione o motivo da denúncia.");
        }
        Listing listing = listingRepository.findByPublicId(adId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado."));
        if (reporterId.equals(listing.getSellerId())) {
            throw new ValidationException("Você não pode denunciar o próprio anúncio.");
        }
        if (reportRepository.existsByAdIdAndReporterIdAndStatus(adId, reporterId, "aberta")) {
            throw new ConflictException("Você já enviou uma denúncia para este anúncio.");
        }
        Report report = new Report();
        report.setId(UUID.randomUUID().toString());
        report.setAdId(adId);
        report.setTitle(emptyToNull(clean(listing.getTitulo(), 120)));
        report.setSeller(emptyToNull(clean(listing.getVendedor(), 40)));
        report.setReason(reason);
        report.setDetails(emptyToNull(clean(req.details(), 600)));
        report.setReporterId(reporterId);
        report.setStatus("aberta");
        reportRepository.save(report);
        return new ReportResponse(report.getId());
    }

    private static String clean(String value, int max) {
        if (value == null) {
            return "";
        }
        String t = value.replaceAll("<[^>]*>", "").replace("<", "").replace(">", "").trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String emptyToNull(String value) {
        return value.isEmpty() ? null : value;
    }
}
