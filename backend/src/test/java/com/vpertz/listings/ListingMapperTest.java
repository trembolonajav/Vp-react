package com.vpertz.listings;

import static org.assertj.core.api.Assertions.assertThat;

import com.vpertz.listings.dto.ListingResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Garante que a entidade é mapeada para o formato de anúncio do frontend. */
class ListingMapperTest {

    private final ListingMapper mapper = new ListingMapper();

    @Test
    void mapeiaChavesNoFormatoLegado() {
        Listing l = new Listing();
        l.setPublicId("gardevoir-shiny");
        l.setTitulo("Gardevoir Shiny");
        l.setGameId("pokeidle");
        l.setImgUrl("assets/gardevoir.webp");
        l.setIntencao("venda");
        l.setMoeda("diamonds");
        l.setPreco(new BigDecimal("350.00"));
        l.setStatus("ativo");
        l.setCriadoEm(LocalDate.of(2026, 7, 20));
        l.setDex(282);
        l.setTipos(List.of("psychic", "fairy"));
        l.setIvs(List.of(31, 31, 30, 31, 31, 32));
        l.setTipo("pokemon");

        ListingResponse dto = mapper.toResponse(l);

        assertThat(dto.id()).isEqualTo("gardevoir-shiny");
        assertThat(dto.jogo()).isEqualTo("pokeidle");
        assertThat(dto.img()).isEqualTo("assets/gardevoir.webp");
        assertThat(dto.moeda()).isEqualTo("diamonds");
        assertThat(dto.criadoEm()).isEqualTo("2026-07-20");
        assertThat(dto.tipo()).isEqualTo("pokemon");
        assertThat(dto.tipos()).containsExactly("psychic", "fairy");
        assertThat(dto.ivs()).containsExactly(31, 31, 30, 31, 31, 32);
    }

    @Test
    void camposNulosViramStringVazia() {
        Listing l = new Listing();
        l.setPublicId("item-1");
        l.setTitulo("Rare Candy");
        l.setIntencao("venda");
        l.setMoeda("brl");

        ListingResponse dto = mapper.toResponse(l);

        assertThat(dto.jogo()).isEmpty();
        assertThat(dto.img()).isEmpty();
        assertThat(dto.criadoEm()).isEmpty();
        assertThat(dto.descricao()).isEmpty();
        assertThat(dto.tipos()).isEmpty();
        assertThat(dto.ivs()).isEmpty();
    }
}
