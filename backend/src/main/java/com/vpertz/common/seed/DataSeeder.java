package com.vpertz.common.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpertz.catalog.Game;
import com.vpertz.catalog.GameRepository;
import com.vpertz.config.SiteConfig;
import com.vpertz.config.SiteConfigRepository;
import com.vpertz.content.Banner;
import com.vpertz.content.BannerRepository;
import com.vpertz.content.Contact;
import com.vpertz.content.ContactRepository;
import com.vpertz.taxonomy.Category;
import com.vpertz.taxonomy.CategoryRepository;
import com.vpertz.taxonomy.GameServer;
import com.vpertz.taxonomy.GameServerRepository;
import java.io.InputStream;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Popula o banco a partir de seed/config.json (a configuração real exportada do
 * sistema atual) quando ele ainda está vazio. Ativo só em dev
 * (app.seed.enabled=true); em produção os dados são migrados de forma controlada.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final ObjectMapper objectMapper;
    private final SiteConfigRepository siteConfigRepository;
    private final GameRepository gameRepository;
    private final BannerRepository bannerRepository;
    private final ContactRepository contactRepository;
    private final CategoryRepository categoryRepository;
    private final GameServerRepository serverRepository;

    public DataSeeder(ObjectMapper objectMapper,
                     SiteConfigRepository siteConfigRepository,
                     GameRepository gameRepository,
                     BannerRepository bannerRepository,
                     ContactRepository contactRepository,
                     CategoryRepository categoryRepository,
                     GameServerRepository serverRepository) {
        this.objectMapper = objectMapper;
        this.siteConfigRepository = siteConfigRepository;
        this.gameRepository = gameRepository;
        this.bannerRepository = bannerRepository;
        this.contactRepository = contactRepository;
        this.categoryRepository = categoryRepository;
        this.serverRepository = serverRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (siteConfigRepository.count() > 0) {
            log.debug("Seed ignorado: configuração já existe.");
            return;
        }

        ClassPathResource resource = new ClassPathResource("seed/config.json");
        if (!resource.exists()) {
            log.warn("seed/config.json não encontrado; banco iniciado vazio.");
            return;
        }

        JsonNode root;
        try (InputStream in = resource.getInputStream()) {
            root = objectMapper.readTree(in);
        }

        seedSiteConfig(root);
        seedGames(root.path("games"));
        seedBanners(root.path("banners"));
        seedContacts(root.path("contatos"));
        JsonNode bazaar = root.path("bazaar");
        seedServers(bazaar.path("servidores"));
        seedCategories(bazaar.path("categorias"));

        log.info("Seed concluído: {} jogo(s), {} banner(s), {} contato(s), {} servidor(es), {} categoria(s).",
                gameRepository.count(), bannerRepository.count(), contactRepository.count(),
                serverRepository.count(), categoryRepository.count());
    }

    private void seedSiteConfig(JsonNode root) {
        JsonNode bazaar = root.path("bazaar");
        SiteConfig site = new SiteConfig();
        site.setId((short) 1);
        site.setWhatsapp(text(root, "whatsapp", ""));
        site.setMsgNegociar(text(root, "msgNegociar", "Olá! Quero negociar."));
        site.setBazaarAtivo(bazaar.path("ativo").asBoolean(true));
        site.setBazaarMsgInteresse(text(bazaar, "msgInteresse", "Olá! Tenho interesse no anúncio {titulo} (#{id})."));
        site.setBazaarMsgAnunciar(text(bazaar, "msgAnunciar", "Olá! Quero anunciar um item no marketplace."));
        siteConfigRepository.save(site);
    }

    private void seedGames(JsonNode games) {
        if (!games.isArray()) {
            return;
        }
        int order = 0;
        for (JsonNode g : games) {
            Game game = new Game();
            game.setId(text(g, "id", "jogo-" + order));
            game.setNome(text(g, "nome", ""));
            game.setItem(text(g, "item", "Itens"));
            game.setUnidade(text(g, "unidade", "item"));
            game.setBotao(text(g, "botao", text(g, "nome", "")));
            game.setImgUrl(text(g, "img", ""));
            game.setIconeUrl(text(g, "icone", null));
            game.setPrecoCompra(decimal(g, "precoCompra"));
            game.setPrecoVenda(decimal(g, "precoVenda"));
            game.setMinQtd(g.path("min").asInt(1));
            game.setMaxQtd(g.path("max").asInt(1));
            game.setAtivo(g.path("ativo").asBoolean(true));
            game.setOrdering(order++);
            gameRepository.save(game);
        }
    }

    private void seedBanners(JsonNode banners) {
        if (!banners.isArray()) {
            return;
        }
        int order = 0;
        for (JsonNode b : banners) {
            Banner banner = new Banner();
            banner.setImgUrl(text(b, "img", ""));
            banner.setAlt(text(b, "alt", null));
            banner.setLink(text(b, "link", null));
            banner.setOrdering(order++);
            bannerRepository.save(banner);
        }
    }

    private void seedContacts(JsonNode contatos) {
        if (!contatos.isArray()) {
            return;
        }
        int order = 0;
        for (JsonNode c : contatos) {
            Contact contact = new Contact();
            contact.setIcone(text(c, "icone", "site"));
            contact.setNome(text(c, "nome", null));
            contact.setInfo(text(c, "info", null));
            contact.setUrl(text(c, "url", null));
            contact.setOrdering(order++);
            contactRepository.save(contact);
        }
    }

    private void seedServers(JsonNode servidores) {
        if (!servidores.isArray()) {
            return;
        }
        int order = 0;
        for (JsonNode s : servidores) {
            String nome = s.asText("").trim();
            if (nome.isEmpty()) {
                continue;
            }
            GameServer server = new GameServer();
            server.setNome(nome);
            server.setOrdering(order++);
            serverRepository.save(server);
        }
    }

    private void seedCategories(JsonNode categorias) {
        if (!categorias.isArray()) {
            return;
        }
        int order = 0;
        for (JsonNode c : categorias) {
            String nome = c.asText("").trim();
            if (nome.isEmpty()) {
                continue;
            }
            Category category = new Category();
            category.setNome(nome);
            category.setOrdering(order++);
            categoryRepository.save(category);
        }
    }

    private static String text(JsonNode node, String field, String fallback) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? fallback : value.asText(fallback);
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.asText("0"));
    }
}
