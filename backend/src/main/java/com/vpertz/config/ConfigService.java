package com.vpertz.config;

import com.vpertz.catalog.Game;
import com.vpertz.catalog.GameRepository;
import com.vpertz.config.dto.BannerDto;
import com.vpertz.config.dto.BazaarConfigDto;
import com.vpertz.config.dto.ConfigResponse;
import com.vpertz.config.dto.ContactDto;
import com.vpertz.config.dto.GameDto;
import com.vpertz.content.BannerRepository;
import com.vpertz.content.ContactRepository;
import com.vpertz.taxonomy.CategoryRepository;
import com.vpertz.taxonomy.GameServerRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Monta a configuração pública no mesmo formato do antigo /api/config,
 * a partir das tabelas normalizadas. É a ponte que permite o frontend legado
 * continuar funcionando enquanto a migração avança.
 */
@Service
public class ConfigService {

    private final SiteConfigRepository siteConfigRepository;
    private final GameRepository gameRepository;
    private final BannerRepository bannerRepository;
    private final ContactRepository contactRepository;
    private final CategoryRepository categoryRepository;
    private final GameServerRepository serverRepository;

    public ConfigService(SiteConfigRepository siteConfigRepository,
                         GameRepository gameRepository,
                         BannerRepository bannerRepository,
                         ContactRepository contactRepository,
                         CategoryRepository categoryRepository,
                         GameServerRepository serverRepository) {
        this.siteConfigRepository = siteConfigRepository;
        this.gameRepository = gameRepository;
        this.bannerRepository = bannerRepository;
        this.contactRepository = contactRepository;
        this.categoryRepository = categoryRepository;
        this.serverRepository = serverRepository;
    }

    @Transactional(readOnly = true)
    public ConfigResponse getPublicConfig() {
        SiteConfig site = siteConfigRepository.findById((short) 1).orElseGet(SiteConfig::new);

        List<BannerDto> banners = bannerRepository.findAllByOrderByOrderingAscIdAsc().stream()
                .map(b -> new BannerDto(b.getImgUrl(), b.getAlt(), b.getLink()))
                .toList();

        List<GameDto> games = gameRepository.findAllByOrderByOrderingAscNomeAsc().stream()
                .map(this::toGameDto)
                .toList();

        List<ContactDto> contatos = contactRepository.findAllByOrderByOrderingAscIdAsc().stream()
                .map(c -> new ContactDto(c.getIcone(), c.getNome(), c.getInfo(), c.getUrl()))
                .toList();

        List<String> servidores = serverRepository.findAllByOrderByOrderingAscNomeAsc().stream()
                .map(s -> s.getNome())
                .toList();

        List<String> categorias = categoryRepository.findAllByOrderByOrderingAscNomeAsc().stream()
                .map(c -> c.getNome())
                .toList();

        BazaarConfigDto bazaar = new BazaarConfigDto(
                site.isBazaarAtivo(),
                nullToEmpty(site.getBazaarMsgInteresse()),
                nullToEmpty(site.getBazaarMsgAnunciar()),
                servidores,
                categorias,
                List.of());

        return new ConfigResponse(
                nullToEmpty(site.getWhatsapp()),
                nullToEmpty(site.getMsgNegociar()),
                banners,
                games,
                bazaar,
                contatos);
    }

    private GameDto toGameDto(Game g) {
        return new GameDto(
                g.getId(), g.getNome(), g.getItem(), g.getUnidade(), g.getBotao(),
                g.getImgUrl(), nullToEmpty(g.getIconeUrl()),
                g.getPrecoCompra(), g.getPrecoVenda(),
                g.getMinQtd(), g.getMaxQtd(), g.isAtivo());
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
