package com.vpertz.config.dto;

import com.vpertz.listings.dto.ListingResponse;
import java.util.List;

/** Bloco do bazaar no formato consumido pelo frontend atual. */
public record BazaarConfigDto(
        boolean ativo,
        String msgInteresse,
        String msgAnunciar,
        List<String> servidores,
        List<String> categorias,
        List<ListingResponse> anuncios) {
}
