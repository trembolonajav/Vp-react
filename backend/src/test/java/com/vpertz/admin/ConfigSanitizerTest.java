package com.vpertz.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vpertz.common.exception.ValidationException;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

class ConfigSanitizerTest {

    @Test
    void whatsappSoDigitosEExigeTamanhoMinimo() {
        assertThat(ConfigSanitizer.whatsapp("+55 (47) 98893-0280")).isEqualTo("5547988930280");
        assertThatThrownBy(() -> ConfigSanitizer.whatsapp("123"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void imgUrlAceitaSeguraRejeitaResto() {
        assertThat(ConfigSanitizer.imgUrl("assets/card.webp")).isEqualTo("assets/card.webp");
        assertThat(ConfigSanitizer.imgUrl("/uploads/img-1.png")).isEqualTo("/uploads/img-1.png");
        assertThat(ConfigSanitizer.imgUrl("https://cdn.site/x.webp")).isEqualTo("https://cdn.site/x.webp");
        assertThat(ConfigSanitizer.imgUrl("javascript:alert(1)")).isEmpty();
        assertThat(ConfigSanitizer.imgUrl("http://inseguro/x.png")).isEmpty();
    }

    @Test
    void linkUrlAceitaHttpPaginaEAncora() {
        assertThat(ConfigSanitizer.linkUrl("https://x.com")).isEqualTo("https://x.com");
        assertThat(ConfigSanitizer.linkUrl("contato.html")).isEqualTo("contato.html");
        assertThat(ConfigSanitizer.linkUrl("#seguranca")).isEqualTo("#seguranca");
        assertThat(ConfigSanitizer.linkUrl("javascript:evil")).isEmpty();
    }

    @Test
    void labelListRemoveVaziosEDuplicados() {
        assertThat(ConfigSanitizer.labelList(Arrays.asList("Pokémon", "pokémon", "  ", "Itens"), 40, 40))
                .containsExactly("Pokémon", "Itens");
    }

    @Test
    void stringsRemovemAnguloEIconValida() {
        assertThat(ConfigSanitizer.str("<b>oi</b>", 40)).isEqualTo("boi/b");
        assertThat(ConfigSanitizer.icon("instagram")).isEqualTo("instagram");
        assertThat(ConfigSanitizer.icon("desconhecido")).isEqualTo("site");
    }
}
