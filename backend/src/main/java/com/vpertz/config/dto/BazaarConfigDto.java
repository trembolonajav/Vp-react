package com.vpertz.config.dto;

import java.util.List;

/**
 * Bloco do bazaar. Nesta fase `anuncios` vem vazio — os anúncios ganham tabela
 * e endpoint próprios na fase de listings; até lá o /api/config legado segue
 * como fonte da vitrine.
 */
public record BazaarConfigDto(
        boolean ativo,
        String msgInteresse,
        String msgAnunciar,
        List<String> servidores,
        List<String> categorias,
        List<Object> anuncios) {
}
