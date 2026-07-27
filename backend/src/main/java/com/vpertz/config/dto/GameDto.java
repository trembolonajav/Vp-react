package com.vpertz.config.dto;

import java.math.BigDecimal;

/**
 * Espelha um jogo da loja no formato do config.json atual (chaves img, icone,
 * min, max) para que o frontend legado funcione sem alteração.
 */
public record GameDto(
        String id,
        String nome,
        String item,
        String unidade,
        String botao,
        String img,
        String icone,
        BigDecimal precoCompra,
        BigDecimal precoVenda,
        int min,
        int max,
        boolean ativo) {
}
