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
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.taxonomy.Category;
import com.vpertz.taxonomy.CategoryRepository;
import com.vpertz.taxonomy.GameServer;
import com.vpertz.taxonomy.GameServerRepository;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
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
    private final ListingRepository listingRepository;

    private static final Pattern ISO_DATE = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

    public DataSeeder(ObjectMapper objectMapper,
                     SiteConfigRepository siteConfigRepository,
                     GameRepository gameRepository,
                     BannerRepository bannerRepository,
                     ContactRepository contactRepository,
                     CategoryRepository categoryRepository,
                     GameServerRepository serverRepository,
                     ListingRepository listingRepository) {
        this.objectMapper = objectMapper;
        this.siteConfigRepository = siteConfigRepository;
        this.gameRepository = gameRepository;
        this.bannerRepository = bannerRepository;
        this.contactRepository = contactRepository;
        this.categoryRepository = categoryRepository;
        this.serverRepository = serverRepository;
        this.listingRepository = listingRepository;
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
        seedListings(bazaar.path("anuncios"));

        log.info("Seed concluído: {} jogo(s), {} banner(s), {} contato(s), {} servidor(es), {} categoria(s), {} anúncio(s).",
                gameRepository.count(), bannerRepository.count(), contactRepository.count(),
                serverRepository.count(), categoryRepository.count(), listingRepository.count());
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

    private void seedListings(JsonNode anuncios) {
        if (!anuncios.isArray()) {
            return;
        }
        for (JsonNode a : anuncios) {
            Listing listing = new Listing();
            listing.setPublicId(text(a, "id", ""));
            listing.setTitulo(text(a, "titulo", ""));
            listing.setGameId(emptyToNull(text(a, "jogo", null)));
            listing.setServidor(emptyToNull(text(a, "servidor", null)));
            listing.setCategoria(emptyToNull(text(a, "categoria", null)));
            listing.setIntencao(text(a, "intencao", "venda"));
            listing.setMoeda(text(a, "moeda", "brl"));
            listing.setPreco(decimal(a, "preco"));
            listing.setNegociavel(a.path("negociavel").asBoolean(false));
            listing.setDestaque(a.path("destaque").asBoolean(false));
            listing.setStatus(text(a, "status", "ativo"));
            listing.setImgUrl(emptyToNull(text(a, "img", null)));
            listing.setDescricao(emptyToNull(text(a, "descricao", null)));
            listing.setVendedor(emptyToNull(text(a, "vendedor", null)));

            String criado = text(a, "criadoEm", "");
            listing.setCriadoEm(ISO_DATE.matcher(criado).matches() ? LocalDate.parse(criado) : null);

            int dex = a.path("dex").asInt(0);
            listing.setDex(dex);
            listing.setNivel(a.path("nivel").asInt(0));
            listing.setPoder(a.path("poder").asInt(0));
            listing.setShiny(a.path("shiny").asBoolean(false));
            listing.setQuantidade(a.path("quantidade").asInt(0));
            listing.setAceitaTroca(a.path("aceitaTroca").asBoolean(false));

            listing.setNatureza(emptyToNull(text(a, "natureza", null)));
            listing.setHabilidade(emptyToNull(text(a, "habilidade", null)));
            listing.setGenero(emptyToNull(text(a, "genero", null)));
            listing.setForma(emptyToNull(text(a, "forma", null)));
            listing.setQualidade(decimal(a, "qualidade"));
            listing.setDisponibilidade(emptyToNull(text(a, "disponibilidade", null)));
            listing.setRegras(emptyToNull(text(a, "regras", null)));

            List<Integer> ivs = intList(a.path("ivs"));
            listing.setIvs(ivs);
            listing.setIvTotal(ivs.size() == 6 ? ivs.stream().mapToInt(Integer::intValue).sum() : null);
            listing.setMoves(strList(a.path("moves")));

            List<String> tipos = strList(a.path("tipos"));
            listing.setTipos(tipos);
            listing.setTipo(deriveTipo(listing.getCategoria(), dex));

            listing.setVendedorVerificado(a.path("vendedorVerificado").asBoolean(false));
            listing.setVendedorOnline(a.path("vendedorOnline").asBoolean(false));
            listing.setVendedorNota(decimal(a, "vendedorNota"));
            listing.setVendedorVendas(a.path("vendedorVendas").asInt(0));
            listing.setVendedorResposta(emptyToNull(text(a, "vendedorResposta", null)));
            listing.setVendedorAvatar(emptyToNull(text(a, "vendedorAvatar", null)));

            listingRepository.save(listing);
        }
    }

    /** Mesma derivação do normalizarAnuncio() do frontend. */
    private static String deriveTipo(String categoria, int dex) {
        if ("Shiny Card".equals(categoria)) {
            return "shinycard";
        }
        if ("Item".equals(categoria) || "Itens".equals(categoria)) {
            return "item";
        }
        if (dex > 0 || "Pokémon".equals(categoria)) {
            return "pokemon";
        }
        return null;
    }

    private static List<Integer> intList(JsonNode node) {
        List<Integer> out = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(v -> out.add(v.asInt(0)));
        }
        return out;
    }

    private static List<String> strList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(v -> {
                String s = v.asText("").trim();
                if (!s.isEmpty()) {
                    out.add(s);
                }
            });
        }
        return out;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
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
