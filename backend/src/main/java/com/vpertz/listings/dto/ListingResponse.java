package com.vpertz.listings.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Anúncio no mesmo formato consumido pelo frontend atual (chaves jogo, img,
 * criadoEm, aceitaTroca, vendedor*). Serve tanto o endpoint de listings quanto
 * o bloco bazaar.anuncios do espelho de configuração.
 */
public record ListingResponse(
        String id,
        String titulo,
        String jogo,
        String servidor,
        String categoria,
        String tipo,
        String intencao,
        String moeda,
        BigDecimal preco,
        boolean negociavel,
        boolean destaque,
        String status,
        String img,
        String descricao,
        String vendedor,
        String criadoEm,
        int dex,
        int nivel,
        int poder,
        List<String> tipos,
        boolean shiny,
        int quantidade,
        boolean aceitaTroca,
        String natureza,
        String habilidade,
        String genero,
        String forma,
        BigDecimal qualidade,
        String disponibilidade,
        List<Integer> ivs,
        List<String> moves,
        String regras,
        boolean vendedorVerificado,
        boolean vendedorOnline,
        BigDecimal vendedorNota,
        int vendedorVendas,
        String vendedorResposta,
        String vendedorAvatar) {
}
