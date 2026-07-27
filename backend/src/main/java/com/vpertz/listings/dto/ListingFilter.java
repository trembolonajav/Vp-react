package com.vpertz.listings.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Critérios de filtro da vitrine, espelhando o aplicarFiltros() do frontend.
 * Campos nulos são ignorados.
 */
public record ListingFilter(
        String q,
        String tipo,
        String intencao,
        String moeda,
        String jogo,
        String categoria,
        String servidor,
        BigDecimal precoMin,
        BigDecimal precoMax,
        Integer ivMin,
        Integer ivMax,
        BigDecimal qualidadeMin,
        BigDecimal qualidadeMax,
        Integer nivelMin,
        Integer nivelMax,
        Integer poderMin,
        Integer poderMax,
        List<String> tipos,
        String status) {
}
