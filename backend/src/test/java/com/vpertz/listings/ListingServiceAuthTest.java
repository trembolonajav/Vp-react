package com.vpertz.listings;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.listings.dto.ListingWriteRequest;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.exception.ResourceNotFoundException;

/** Autorização das escritas: só dono ou admin gerenciam o anúncio. */
@ExtendWith(MockitoExtension.class)
class ListingServiceAuthTest {

    @Mock private ListingRepository repository;
    @Mock private ListingMapper mapper;

    @InjectMocks private ListingService service;

    private static final ListingWriteRequest REQ = new ListingWriteRequest(
            "Título", null, null, null, null, null, null, false, null, null, null, null,
            null, null, null, false, null, false, null, null, null, null, null, null,
            null, null, null, null);

    @Test
    void naoDonoNemAdminRecebe403() {
        Listing listing = listing("outro-dono");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));

        AuthPrincipal intruso = new AuthPrincipal("eu", "eu", "USER");

        assertThatThrownBy(() -> service.update("x", REQ, intruso))
                .isInstanceOf(AccessDeniedException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void donoAtualizaOProprioAnuncio() {
        Listing listing = listing("eu");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.update("x", REQ, new AuthPrincipal("eu", "eu", "USER"));

        verify(repository).save(listing);
    }

    @Test
    void adminEditaAnuncioLegadoSemDono() {
        Listing listing = listing(null);
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.update("x", REQ, new AuthPrincipal("admin", "admin", "ADMIN"));

        verify(repository).save(listing);
    }

    @Test
    void donoPodePausarOProprioAnuncio() {
        Listing listing = listing("eu");
        listing.setStatus("ativo");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.updateStatus("x", "pausado", new AuthPrincipal("eu", "eu", "USER"));

        assertThat(listing.getStatus()).isEqualTo("pausado");
        verify(repository).save(listing);
    }

    @Test
    void intrusoNaoPodeAlterarStatus() {
        Listing listing = listing("outro-dono");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.updateStatus(
                "x", "vendido", new AuthPrincipal("eu", "eu", "USER")))
                .isInstanceOf(AccessDeniedException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void rejeitaStatusDesconhecido() {
        Listing listing = listing("eu");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.updateStatus(
                "x", "arquivado", new AuthPrincipal("eu", "eu", "USER")))
                .isInstanceOf(ValidationException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void anuncioPausadoNaoVazaParaVisitante() {
        Listing listing = listing("dono");
        listing.setStatus("pausado");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.getByPublicId("x", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void donoAindaPodeAbrirAnuncioPausadoParaEditar() {
        Listing listing = listing("dono");
        listing.setStatus("pausado");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));

        service.getByPublicId("x", new AuthPrincipal("dono", "dono", "USER"));

        verify(mapper).toResponse(listing);
    }

    @Test
    void somenteAdminPodeMarcarAnuncioComoRemovido() {
        Listing listing = listing("dono");
        when(repository.findByPublicId("x")).thenReturn(Optional.of(listing));
        when(repository.save(listing)).thenReturn(listing);

        service.updateStatusAsAdmin("x", "removido", new AuthPrincipal("admin", "admin", "ADMIN"));

        assertThat(listing.getStatus()).isEqualTo("removido");
    }

    private static Listing listing(String sellerId) {
        Listing listing = new Listing();
        listing.setPublicId("x");
        listing.setSellerId(sellerId);
        return listing;
    }
}
