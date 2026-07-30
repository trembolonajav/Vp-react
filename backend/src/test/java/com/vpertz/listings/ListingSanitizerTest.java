package com.vpertz.listings;

import static org.assertj.core.api.Assertions.assertThat;

import com.vpertz.listings.dto.ListingWriteRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Sanitização server-side: enums, clamps, tipos/IVs e URL de imagem segura. */
class ListingSanitizerTest {

    @Test
    void aplicaDefaultsClampsEDerivaTipo() {
        Listing l = new Listing();
        ListingSanitizer.apply(req("Pokémon", 282, "xyz", "abc", "bad",
                new BigDecimal("-5"), 500,
                List.of("psychic", "fairy", "fire"),
                List.of(31, 31, 31, 31, 31, 29),
                "assets/gardevoir.webp"), l);

        assertThat(l.getIntencao()).isEqualTo("venda");   // enum inválido -> default
        assertThat(l.getMoeda()).isEqualTo("brl");
        assertThat(l.getStatus()).isEqualTo("ativo");
        assertThat(l.getPreco()).isEqualByComparingTo("0.00"); // negativo -> 0
        assertThat(l.getNivel()).isEqualTo(500);          // PokeIdle usa níveis acima de 100
        assertThat(l.getTipos()).containsExactly("psychic", "fairy"); // máx 2, desconhecidos fora
        assertThat(l.getTipo()).isEqualTo("pokemon");     // dex > 0
        assertThat(l.getIvTotal()).isEqualTo(184);        // soma dos 6
        assertThat(l.getImgUrl()).isEqualTo("assets/gardevoir.webp");
    }

    @Test
    void rejeitaImagemInseguraEIvsInvalidos() {
        Listing l = new Listing();
        ListingSanitizer.apply(req("Itens", 0, "compra", "diamonds", "vendido",
                new BigDecimal("10"), 5,
                List.of(),
                List.of(31, 31), // tamanho != 6 -> descartado
                "javascript:alert(1)"), l);

        assertThat(l.getImgUrl()).isNull();               // esquema perigoso rejeitado
        assertThat(l.getIvs()).isEmpty();
        assertThat(l.getIvTotal()).isNull();
        assertThat(l.getTipo()).isEqualTo("item");        // categoria "Itens"
        assertThat(l.getStatus()).isEqualTo("vendido");
        assertThat(l.getMoeda()).isEqualTo("diamonds");
    }

    @Test
    void limitaNivelAoTetoDoPokeIdleERemoveTagsHtml() {
        Listing l = new Listing();
        ListingWriteRequest request = new ListingWriteRequest(
                "<b>Gyarados</b>", "pokeidle", "Genesis", "Pokémon", "venda", "brl",
                BigDecimal.ONE, false, null, "ativo", null, "<script>alert(1)</script>Seguro",
                130, 5000, 9525, false, 1, false, null, null, null, null,
                null, null, List.of("water", "flying"), null, null, null);

        ListingSanitizer.apply(request, l);

        assertThat(l.getTitulo()).isEqualTo("Gyarados");
        assertThat(l.getDescricao()).isEqualTo("alert(1)Seguro");
        assertThat(l.getNivel()).isEqualTo(1000);
    }

    private static ListingWriteRequest req(String categoria, Integer dex, String intencao, String moeda,
                                          String status, BigDecimal preco, Integer nivel,
                                          List<String> tipos, List<Integer> ivs, String img) {
        return new ListingWriteRequest(
                "Gardevoir", "pokeidle", "Genesis", categoria, intencao, moeda, preco,
                false, null, status, img, "desc", dex, nivel, 0, false, 1, false,
                null, null, null, null, null, null, tipos, ivs, null, null);
    }
}
