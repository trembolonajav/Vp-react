package com.vpertz.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.admin.dto.AdminModerationDtos.ReviewRequest;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.listings.ListingService;
import com.vpertz.reports.Report;
import com.vpertz.reports.ReportRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminModerationServiceTest {
    @Mock private ReportRepository reports;
    @Mock private ListingService listings;
    private AdminModerationService service;
    private final AuthPrincipal admin = new AuthPrincipal("admin-id", "vpadmin", "ADMIN");

    @BeforeEach
    void setUp() {
        service = new AdminModerationService(reports, listings);
    }

    @Test
    void registraDecisaoEAdministradorResponsavel() {
        Report report = new Report();
        report.setId("report-1");
        report.setAdId("an-1");
        report.setReason("Golpe");
        when(reports.findById("report-1")).thenReturn(Optional.of(report));
        when(reports.save(report)).thenReturn(report);

        var result = service.review("report-1", new ReviewRequest("resolvida", "<b>Removido</b>"), admin);

        assertThat(result.status()).isEqualTo("resolvida");
        assertThat(result.reviewedBy()).isEqualTo("admin-id");
        assertThat(result.reviewedAt()).isNotNull();
        assertThat(result.resolutionNote()).isEqualTo("Removido");
    }

    @Test
    void rejeitaStatusDeDenunciaInventado() {
        assertThatThrownBy(() -> service.review(
                "report-1", new ReviewRequest("apagada", ""), admin))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void encaminhaModeracaoDeAnuncioComIdentidadeAdmin() {
        service.updateListingStatus("an-1", "removido", admin);
        verify(listings).updateStatusAsAdmin("an-1", "removido", admin);
    }

    @Test
    void rejeitaStatusDeAnuncioInventado() {
        assertThatThrownBy(() -> service.updateListingStatus("an-1", "banido", admin))
                .isInstanceOf(ValidationException.class);
    }
}
