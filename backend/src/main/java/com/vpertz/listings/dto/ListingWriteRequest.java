package com.vpertz.listings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Corpo de criação/atualização de anúncio. Só o título é obrigatório (como no
 * validate.mjs atual); o restante é saneado e limitado no service — enums com
 * default, números clampeados, strings sem &lt;&gt;, tipos/IVs/moves validados.
 * `destaque` só é aplicado para administradores.
 */
public record ListingWriteRequest(
        @NotBlank(message = "Título obrigatório.") @Size(max = 90) String titulo,
        @Size(max = 40) String jogo,
        @Size(max = 40) String servidor,
        @Size(max = 40) String categoria,
        String intencao,
        String moeda,
        BigDecimal preco,
        boolean negociavel,
        Boolean destaque,
        String status,
        @Size(max = 800) String img,
        @Size(max = 1200) String descricao,
        Integer dex,
        Integer nivel,
        Integer poder,
        boolean shiny,
        Integer quantidade,
        boolean aceitaTroca,
        @Size(max = 40) String natureza,
        @Size(max = 40) String habilidade,
        String genero,
        @Size(max = 40) String forma,
        BigDecimal qualidade,
        String disponibilidade,
        List<String> tipos,
        List<Integer> ivs,
        List<String> moves,
        @Size(max = 800) String regras) {
}
