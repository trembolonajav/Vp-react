package com.vpertz.config.dto;

import java.util.List;

/**
 * Resposta pública da configuração do site. Reproduz exatamente o formato do
 * antigo GET /api/config para permitir migração sem quebrar o frontend.
 */
public record ConfigResponse(
        String whatsapp,
        String msgNegociar,
        List<BannerDto> banners,
        List<GameDto> games,
        BazaarConfigDto bazaar,
        List<ContactDto> contatos) {
}
