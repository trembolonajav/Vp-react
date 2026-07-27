package com.vpertz.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.vpertz.catalog.Game;
import com.vpertz.catalog.GameRepository;
import com.vpertz.config.dto.ConfigResponse;
import com.vpertz.content.BannerRepository;
import com.vpertz.content.Contact;
import com.vpertz.content.ContactRepository;
import com.vpertz.taxonomy.Category;
import com.vpertz.taxonomy.CategoryRepository;
import com.vpertz.taxonomy.GameServer;
import com.vpertz.taxonomy.GameServerRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Garante que o espelho da config mantém o contrato esperado pelo frontend. */
@ExtendWith(MockitoExtension.class)
class ConfigServiceTest {

    @Mock private SiteConfigRepository siteConfigRepository;
    @Mock private GameRepository gameRepository;
    @Mock private BannerRepository bannerRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private GameServerRepository serverRepository;

    @InjectMocks private ConfigService configService;

    @Test
    void montaConfigNoFormatoLegado() {
        SiteConfig site = new SiteConfig();
        site.setWhatsapp("5547988930280");
        site.setMsgNegociar("Olá!");
        site.setBazaarAtivo(true);
        site.setBazaarMsgInteresse("Interesse {titulo}");
        site.setBazaarMsgAnunciar("Anunciar");
        when(siteConfigRepository.findById((short) 1)).thenReturn(Optional.of(site));

        Game game = new Game();
        game.setId("pokeidle");
        game.setNome("PokeIdle World");
        game.setItem("Diamonds");
        game.setUnidade("diamante");
        game.setBotao("[PokeIdle] Diamonds");
        game.setImgUrl("assets/card.webp");
        game.setIconeUrl("assets/icone.webp");
        game.setPrecoCompra(new BigDecimal("0.30"));
        game.setPrecoVenda(new BigDecimal("0.20"));
        game.setMinQtd(1);
        game.setMaxQtd(1000);
        game.setAtivo(true);
        when(gameRepository.findAllByOrderByOrderingAscNomeAsc()).thenReturn(List.of(game));

        when(bannerRepository.findAllByOrderByOrderingAscIdAsc()).thenReturn(List.of());

        Contact contact = new Contact();
        contact.setIcone("whatsapp");
        contact.setNome("WhatsApp");
        contact.setInfo("Atendimento");
        contact.setUrl("");
        when(contactRepository.findAllByOrderByOrderingAscIdAsc()).thenReturn(List.of(contact));

        GameServer server = new GameServer();
        server.setNome("Genesis");
        when(serverRepository.findAllByOrderByOrderingAscNomeAsc()).thenReturn(List.of(server));

        Category category = new Category();
        category.setNome("Pokémon");
        when(categoryRepository.findAllByOrderByOrderingAscNomeAsc()).thenReturn(List.of(category));

        ConfigResponse config = configService.getPublicConfig();

        assertThat(config.whatsapp()).isEqualTo("5547988930280");
        assertThat(config.msgNegociar()).isEqualTo("Olá!");
        assertThat(config.games()).hasSize(1);
        assertThat(config.games().get(0).id()).isEqualTo("pokeidle");
        assertThat(config.games().get(0).min()).isEqualTo(1);
        assertThat(config.games().get(0).max()).isEqualTo(1000);
        assertThat(config.banners()).isEmpty();
        assertThat(config.contatos()).hasSize(1);
        assertThat(config.contatos().get(0).icone()).isEqualTo("whatsapp");
        assertThat(config.bazaar().ativo()).isTrue();
        assertThat(config.bazaar().servidores()).containsExactly("Genesis");
        assertThat(config.bazaar().categorias()).containsExactly("Pokémon");
        assertThat(config.bazaar().anuncios()).isEmpty();
    }
}
