package com.vpertz.reports;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.reports.dto.ReportDtos.ReportRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @InjectMocks private ReportService reportService;

    @Test
    void exigeAdEMotivo() {
        assertThatThrownBy(() -> reportService.create("u1", new ReportRequest("", null, null, "", null)))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void denunciaDuplicadaConflita() {
        when(reportRepository.existsByAdIdAndReporterIdAndStatus("an-1", "u1", "aberta")).thenReturn(true);

        assertThatThrownBy(() -> reportService.create("u1", new ReportRequest("an-1", null, null, "Golpe", null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void criaDenunciaValida() {
        when(reportRepository.existsByAdIdAndReporterIdAndStatus("an-1", "u1", "aberta")).thenReturn(false);

        var resp = reportService.create("u1", new ReportRequest("an-1", "Gengar", "moonlight", "Golpe", "detalhe"));

        assertThat(resp.id()).isNotBlank();
        verify(reportRepository).save(any());
    }
}
