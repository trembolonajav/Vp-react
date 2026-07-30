package com.vpertz.reports;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.reports.dto.ReportDtos.ReportRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @Mock private ListingRepository listingRepository;
    @InjectMocks private ReportService reportService;

    @Test
    void exigeAdEMotivo() {
        assertThatThrownBy(() -> reportService.create("u1", new ReportRequest("", null, null, "", null)))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void denunciaDuplicadaConflita() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(java.util.Optional.of(listing("seller-id")));
        when(reportRepository.existsByAdIdAndReporterIdAndStatus("an-1", "u1", "aberta")).thenReturn(true);

        assertThatThrownBy(() -> reportService.create("u1", new ReportRequest("an-1", null, null, "Golpe", null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void criaDenunciaValida() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(java.util.Optional.of(listing("seller-id")));
        when(reportRepository.existsByAdIdAndReporterIdAndStatus("an-1", "u1", "aberta")).thenReturn(false);

        var resp = reportService.create("u1", new ReportRequest("an-1", "Gengar", "moonlight", "Golpe", "detalhe"));

        assertThat(resp.id()).isNotBlank();
        verify(reportRepository).save(any());
    }

    @Test
    void anuncioInexistenteNaoPodeSerDenunciado() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> reportService.create(
                "u1", new ReportRequest("an-1", null, null, "Golpe", null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void donoNaoPodeDenunciarOProprioAnuncio() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(java.util.Optional.of(listing("u1")));

        assertThatThrownBy(() -> reportService.create(
                "u1", new ReportRequest("an-1", null, null, "Golpe", null)))
                .isInstanceOf(ValidationException.class);
    }

    private static Listing listing(String sellerId) {
        Listing listing = new Listing();
        listing.setPublicId("an-1");
        listing.setSellerId(sellerId);
        listing.setTitulo("Título real");
        listing.setVendedor("vendedor-real");
        return listing;
    }
}
