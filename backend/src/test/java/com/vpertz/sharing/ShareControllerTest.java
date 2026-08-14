package com.vpertz.sharing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import java.math.BigDecimal;
import java.io.ByteArrayInputStream;
import javax.imageio.ImageIO;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ShareControllerTest {
    @Mock private ListingRepository listingRepository;
    private ShareController controller;

    @BeforeEach
    void setUp() {
        controller = new ShareController(listingRepository, "https://vpertz.example/");
    }

    @Test
    void geraMetadadosComRotaLimpaEDadosEscapados() {
        Listing listing = listing();
        listing.setTitulo("<script>Gyarados</script>");
        when(listingRepository.findByPublicId("gyarados")).thenReturn(Optional.of(listing));

        var response = controller.share("gyarados");

        assertThat(response.getBody())
                .contains("og:title", "twitter:card", "https://vpertz.example/bazaar/anuncio/gyarados")
                .contains("&lt;script&gt;Gyarados&lt;/script&gt;")
                .doesNotContain("<script>Gyarados</script>");
    }

    @Test
    void geraPngSocialNoTamanhoEsperado() {
        when(listingRepository.findByPublicId("gyarados")).thenReturn(Optional.of(listing()));

        byte[] png = controller.image("gyarados").getBody();

        assertThat(png).isNotNull().startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4e, (byte) 0x47);
        assertThat(png.length).isGreaterThan(10_000);
        try {
            var image = ImageIO.read(new ByteArrayInputStream(png));
            assertThat(image.getWidth()).isEqualTo(1200);
            assertThat(image.getHeight()).isEqualTo(630);
        } catch (Exception exception) {
            throw new AssertionError(exception);
        }
    }

    @Test
    void usaImagemSocialGrandeEmVezDoSpritePequeno() {
        Listing listing = listing();
        listing.setImgUrl("https://sprites.example/flareon.png");
        when(listingRepository.findByPublicId("gyarados")).thenReturn(Optional.of(listing));

        String html = controller.share("gyarados").getBody();

        assertThat(html)
                .contains("property=\"og:image\" content=\"https://vpertz.example/api/v1/share/gyarados/image.png?v=3\"")
                .contains("name=\"twitter:card\" content=\"summary_large_image\"")
                .contains("og:image:width\" content=\"1200", "og:image:height\" content=\"630")
                .doesNotContain("https://sprites.example/flareon.png");
    }

    @Test
    void anuncioInexistenteRetornaErroDeRecurso() {
        when(listingRepository.findByPublicId("fantasma")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.share("fantasma"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private static Listing listing() {
        Listing listing = new Listing();
        listing.setPublicId("gyarados");
        listing.setTitulo("Gyarados");
        listing.setNivel(433);
        listing.setCategoria("Pokémon");
        listing.setPreco(new BigDecimal("29.90"));
        listing.setMoeda("brl");
        listing.setVendedor("misty");
        return listing;
    }
}
