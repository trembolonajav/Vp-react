package com.vpertz.favorites;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.listings.ListingRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {
    @Mock private FavoriteRepository repository;
    @Mock private ListingRepository listingRepository;
    @InjectMocks private FavoriteService service;

    @Test
    void listaSomenteFavoritosDoUsuario() {
        Favorite favorite = new Favorite();
        favorite.setUserId("u1");
        favorite.setListingPublicId("an-1");
        when(repository.findByUserIdOrderByCreatedAtDesc("u1")).thenReturn(List.of(favorite));

        assertThat(service.list("u1")).containsExactly("an-1");
    }

    @Test
    void adicionaDeFormaIdempotente() {
        when(listingRepository.existsByPublicId("an-1")).thenReturn(true);
        when(repository.findByUserIdAndListingPublicId("u1", "an-1")).thenReturn(Optional.empty());

        service.add("u1", "an-1");

        verify(repository).save(any(Favorite.class));
    }

    @Test
    void naoDuplicaFavoritoExistente() {
        when(listingRepository.existsByPublicId("an-1")).thenReturn(true);
        when(repository.findByUserIdAndListingPublicId("u1", "an-1"))
                .thenReturn(Optional.of(new Favorite()));

        service.add("u1", "an-1");

        verify(repository, never()).save(any());
    }

    @Test
    void rejeitaAnuncioInexistente() {
        when(listingRepository.existsByPublicId("fantasma")).thenReturn(false);

        assertThatThrownBy(() -> service.add("u1", "fantasma"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
