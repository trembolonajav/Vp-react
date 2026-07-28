package com.vpertz.admin;

import com.vpertz.admin.dto.AdminConfigRequest;
import com.vpertz.admin.dto.AdminConfigRequest.BannerInput;
import com.vpertz.admin.dto.AdminConfigRequest.BazaarInput;
import com.vpertz.admin.dto.AdminConfigRequest.ContactInput;
import com.vpertz.admin.dto.AdminConfigRequest.GameInput;
import com.vpertz.catalog.Game;
import com.vpertz.catalog.GameRepository;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.config.ConfigService;
import com.vpertz.config.SiteConfig;
import com.vpertz.config.SiteConfigRepository;
import com.vpertz.config.dto.ConfigResponse;
import com.vpertz.content.Banner;
import com.vpertz.content.BannerRepository;
import com.vpertz.content.Contact;
import com.vpertz.content.ContactRepository;
import com.vpertz.taxonomy.Category;
import com.vpertz.taxonomy.CategoryRepository;
import com.vpertz.taxonomy.GameServer;
import com.vpertz.taxonomy.GameServerRepository;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Escrita da configuração do site pelo painel. Substitui, numa única
 * transação, o conteúdo saneado das tabelas normalizadas. Não toca nos
 * anúncios (têm CRUD e dono próprios).
 */
@Service
public class AdminConfigService {

    private static final int MAX_BANNERS = 10;
    private static final int MAX_GAMES = 20;
    private static final int MAX_CONTACTS = 20;
    private static final int MAX_LABELS = 40;

    private final SiteConfigRepository siteConfigRepository;
    private final GameRepository gameRepository;
    private final BannerRepository bannerRepository;
    private final ContactRepository contactRepository;
    private final CategoryRepository categoryRepository;
    private final GameServerRepository serverRepository;
    private final ConfigService configService;

    public AdminConfigService(SiteConfigRepository siteConfigRepository,
                             GameRepository gameRepository,
                             BannerRepository bannerRepository,
                             ContactRepository contactRepository,
                             CategoryRepository categoryRepository,
                             GameServerRepository serverRepository,
                             ConfigService configService) {
        this.siteConfigRepository = siteConfigRepository;
        this.gameRepository = gameRepository;
        this.bannerRepository = bannerRepository;
        this.contactRepository = contactRepository;
        this.categoryRepository = categoryRepository;
        this.serverRepository = serverRepository;
        this.configService = configService;
    }

    @Transactional
    public ConfigResponse replace(AdminConfigRequest request) {
        BazaarInput bazaar = request.bazaar() != null
                ? request.bazaar()
                : new BazaarInput(true, null, null, List.of(), List.of());

        saveSiteConfig(request, bazaar);
        reconcileGames(request.games());
        replaceBanners(request.banners());
        replaceContacts(request.contatos());
        replaceLabels(bazaar);

        return configService.getPublicConfig();
    }

    private void saveSiteConfig(AdminConfigRequest request, BazaarInput bazaar) {
        SiteConfig site = siteConfigRepository.findById((short) 1).orElseGet(() -> {
            SiteConfig fresh = new SiteConfig();
            fresh.setId((short) 1);
            return fresh;
        });
        site.setWhatsapp(ConfigSanitizer.whatsapp(request.whatsapp()));
        site.setMsgNegociar(ConfigSanitizer.strOr(request.msgNegociar(), 300, "Olá! Quero negociar."));
        site.setBazaarAtivo(bazaar.ativo() == null || bazaar.ativo());
        site.setBazaarMsgInteresse(ConfigSanitizer.strOr(bazaar.msgInteresse(), 300,
                "Olá! Tenho interesse no anúncio {titulo} (#{id})."));
        site.setBazaarMsgAnunciar(ConfigSanitizer.strOr(bazaar.msgAnunciar(), 300,
                "Olá! Quero anunciar um item no marketplace."));
        site.setUpdatedAt(OffsetDateTime.now());
        siteConfigRepository.save(site);
    }

    /** Atualiza os jogos existentes, insere novos e remove os que sumiram
     *  (a FK em listings.game_id fica nula — mesmo comportamento do legado). */
    private void reconcileGames(List<GameInput> input) {
        List<GameInput> games = input == null ? List.of() : input.stream().limit(MAX_GAMES).toList();
        Map<String, Game> existing = new LinkedHashMap<>();
        gameRepository.findAll().forEach(g -> existing.put(g.getId(), g));

        Set<String> incoming = new LinkedHashSet<>();
        int order = 0;
        for (GameInput g : games) {
            String id = ConfigSanitizer.gameId(g.id(), order);
            while (incoming.contains(id)) {
                id += "x";
            }
            String img = ConfigSanitizer.imgUrl(g.img());
            if (img.isEmpty()) {
                throw new ValidationException("Jogo \"" + ConfigSanitizer.str(g.nome(), 80) + "\": arte do card inválida.");
            }
            Game game = existing.getOrDefault(id, new Game());
            game.setId(id);
            game.setNome(ConfigSanitizer.str(g.nome(), 80));
            game.setItem(ConfigSanitizer.strOr(g.item(), 80, "Itens"));
            game.setUnidade(ConfigSanitizer.strOr(g.unidade(), 40, "item"));
            game.setBotao(ConfigSanitizer.strOr(g.botao(), 80, ConfigSanitizer.str(g.nome(), 80)));
            game.setImgUrl(img);
            game.setIconeUrl(ConfigSanitizer.emptyToNull(ConfigSanitizer.imgUrl(g.icone())));
            game.setPrecoCompra(ConfigSanitizer.num(g.precoCompra(), 0, 100000, 2));
            game.setPrecoVenda(ConfigSanitizer.num(g.precoVenda(), 0, 100000, 2));
            int min = ConfigSanitizer.intv(g.min(), 1, 1000000);
            int max = ConfigSanitizer.intv(g.max(), 1, 1000000);
            game.setMinQtd(Math.min(min, max));
            game.setMaxQtd(Math.max(min, max));
            game.setAtivo(g.ativo() == null || g.ativo());
            game.setOrdering(order++);
            game.setUpdatedAt(OffsetDateTime.now());
            gameRepository.save(game);
            incoming.add(id);
        }
        existing.keySet().stream()
                .filter(id -> !incoming.contains(id))
                .forEach(gameRepository::deleteById);
    }

    private void replaceBanners(List<BannerInput> input) {
        bannerRepository.deleteAllInBatch();
        if (input == null) {
            return;
        }
        int order = 0;
        for (BannerInput b : input.stream().limit(MAX_BANNERS).toList()) {
            String img = ConfigSanitizer.imgUrl(b.img());
            if (img.isEmpty()) {
                throw new ValidationException("Banner " + (order + 1) + ": imagem inválida.");
            }
            Banner banner = new Banner();
            banner.setImgUrl(img);
            banner.setAlt(ConfigSanitizer.emptyToNull(ConfigSanitizer.str(b.alt(), 200)));
            banner.setLink(ConfigSanitizer.emptyToNull(ConfigSanitizer.linkUrl(b.link())));
            banner.setOrdering(order++);
            bannerRepository.save(banner);
        }
    }

    private void replaceContacts(List<ContactInput> input) {
        contactRepository.deleteAllInBatch();
        if (input == null) {
            return;
        }
        int order = 0;
        for (ContactInput c : input.stream().limit(MAX_CONTACTS).toList()) {
            Contact contact = new Contact();
            contact.setIcone(ConfigSanitizer.icon(c.icone()));
            contact.setNome(ConfigSanitizer.emptyToNull(ConfigSanitizer.str(c.nome(), 40)));
            contact.setInfo(ConfigSanitizer.emptyToNull(ConfigSanitizer.str(c.info(), 120)));
            contact.setUrl(ConfigSanitizer.emptyToNull(ConfigSanitizer.linkUrl(c.url())));
            contact.setOrdering(order++);
            contactRepository.save(contact);
        }
    }

    private void replaceLabels(BazaarInput bazaar) {
        categoryRepository.deleteAllInBatch();
        serverRepository.deleteAllInBatch();

        int order = 0;
        for (String nome : ConfigSanitizer.labelList(bazaar.categorias(), MAX_LABELS, 40)) {
            Category category = new Category();
            category.setNome(nome);
            category.setOrdering(order++);
            categoryRepository.save(category);
        }
        order = 0;
        for (String nome : ConfigSanitizer.labelList(bazaar.servidores(), MAX_LABELS, 40)) {
            GameServer server = new GameServer();
            server.setNome(nome);
            server.setOrdering(order++);
            serverRepository.save(server);
        }
    }
}
