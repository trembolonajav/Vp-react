package com.vpertz.admin.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Corpo de escrita da configuração do site pelo painel. Mesma forma do GET
 * /api/v1/config (menos os anúncios, que têm CRUD próprio e dono). Tudo é
 * saneado no servidor antes de persistir.
 */
public record AdminConfigRequest(
        String whatsapp,
        String msgNegociar,
        List<BannerInput> banners,
        List<GameInput> games,
        BazaarInput bazaar,
        List<ContactInput> contatos) {

    public record BannerInput(String img, String alt, String link) {
    }

    public record GameInput(
            String id, String nome, String item, String unidade, String botao,
            String img, String icone, BigDecimal precoCompra, BigDecimal precoVenda,
            Integer min, Integer max, Boolean ativo) {
    }

    public record BazaarInput(
            Boolean ativo, String msgInteresse, String msgAnunciar,
            List<String> servidores, List<String> categorias) {
    }

    public record ContactInput(String icone, String nome, String info, String url) {
    }
}
