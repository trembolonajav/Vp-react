package com.vpertz.listings;

import com.vpertz.listings.dto.ListingWriteRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Saneia os dados de escrita de anúncio, portando as regras do validate.mjs:
 * enums com default, números clampeados, strings sem &lt;&gt;, tipos/IVs/moves
 * validados e URL de imagem restrita a caminhos seguros. Nunca confia no cliente.
 */
final class ListingSanitizer {

    private static final Set<String> TYPE_KEYS = Set.of(
            "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
            "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy");
    private static final Set<String> INTENCOES = Set.of("venda", "compra");
    private static final Set<String> MOEDAS = Set.of("brl", "diamonds");
    private static final Set<String> STATUS = Set.of("ativo", "pausado", "vendido");
    private static final Set<String> GENEROS = Set.of("macho", "femea", "sem");
    private static final Set<String> DISPONIBILIDADES = Set.of("Venda", "Troca", "Venda e Troca");

    private static final Pattern IMG_ASSET = Pattern.compile("^assets/[\\w\\-./]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_UPLOAD = Pattern.compile("^/uploads/[\\w\\-.]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_MEDIA = Pattern.compile("^/media/[\\w\\-.]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_HTTPS = Pattern.compile("^https://[^\\s\"'<>]+$", Pattern.CASE_INSENSITIVE);

    private ListingSanitizer() {
    }

    /** Aplica os campos saneados do request na entidade. Não mexe em dono/publicId/destaque. */
    static void apply(ListingWriteRequest r, Listing listing) {
        listing.setTitulo(str(r.titulo(), 90));
        listing.setGameId(emptyToNull(str(r.jogo(), 40)));
        listing.setServidor(emptyToNull(str(r.servidor(), 40)));
        listing.setCategoria(emptyToNull(str(r.categoria(), 40)));
        listing.setIntencao(oneOf(r.intencao(), INTENCOES, "venda"));
        listing.setMoeda(oneOf(r.moeda(), MOEDAS, "brl"));
        listing.setPreco(clamp(r.preco(), 0, 10_000_000, 2));
        listing.setNegociavel(r.negociavel());
        listing.setStatus(oneOf(r.status(), STATUS, "ativo"));
        listing.setImgUrl(imgUrl(r.img()));
        listing.setDescricao(emptyToNull(str(r.descricao(), 1200)));

        int dex = clampInt(r.dex(), 0, 1025);
        listing.setDex(dex);
        listing.setNivel(clampInt(r.nivel(), 0, 100));
        listing.setPoder(clampInt(r.poder(), 0, 1_000_000));
        listing.setShiny(r.shiny());
        listing.setQuantidade(clampInt(r.quantidade(), 0, 1_000_000));
        listing.setAceitaTroca(r.aceitaTroca());

        listing.setNatureza(emptyToNull(str(r.natureza(), 40)));
        listing.setHabilidade(emptyToNull(str(r.habilidade(), 40)));
        listing.setGenero(oneOfOrNull(r.genero(), GENEROS));
        listing.setForma(emptyToNull(str(r.forma(), 40)));
        listing.setQualidade(clamp(r.qualidade(), 0, 999, 3));
        listing.setDisponibilidade(oneOfOrNull(r.disponibilidade(), DISPONIBILIDADES));
        listing.setRegras(emptyToNull(str(r.regras(), 800)));

        List<String> tipos = tipos(r.tipos());
        listing.setTipos(tipos);
        listing.setTipo(deriveTipo(listing.getCategoria(), dex));

        List<Integer> ivs = ivs(r.ivs());
        listing.setIvs(ivs);
        listing.setIvTotal(ivs.size() == 6 ? ivs.stream().mapToInt(Integer::intValue).sum() : null);
        listing.setMoves(moves(r.moves()));
    }

    /** Mesma derivação do normalizarAnuncio() do frontend. */
    static String deriveTipo(String categoria, int dex) {
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

    private static String str(String value, int max) {
        if (value == null) {
            return "";
        }
        String cleaned = value.replaceAll("[<>]", "").trim();
        return cleaned.length() > max ? cleaned.substring(0, max) : cleaned;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }

    private static String oneOf(String value, Set<String> allowed, String fallback) {
        return value != null && allowed.contains(value) ? value : fallback;
    }

    private static String oneOfOrNull(String value, Set<String> allowed) {
        return value != null && allowed.contains(value) ? value : null;
    }

    private static BigDecimal clamp(BigDecimal value, long min, long max, int scale) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value;
        v = v.max(BigDecimal.valueOf(min)).min(BigDecimal.valueOf(max));
        return v.setScale(scale, RoundingMode.HALF_UP);
    }

    private static int clampInt(Integer value, int min, int max) {
        int v = value == null ? min : value;
        return Math.max(min, Math.min(max, v));
    }

    private static String imgUrl(String value) {
        if (value == null) {
            return null;
        }
        String s = value.trim();
        if (s.length() > 800) {
            s = s.substring(0, 800);
        }
        if (IMG_ASSET.matcher(s).matches() || IMG_UPLOAD.matcher(s).matches()
                || IMG_MEDIA.matcher(s).matches() || IMG_HTTPS.matcher(s).matches()) {
            return s;
        }
        return null;
    }

    private static List<String> tipos(List<String> input) {
        if (input == null) {
            return new ArrayList<>();
        }
        Set<String> out = new LinkedHashSet<>();
        for (String t : input) {
            if (t != null && TYPE_KEYS.contains(t)) {
                out.add(t);
            }
            if (out.size() == 2) {
                break;
            }
        }
        return new ArrayList<>(out);
    }

    private static List<Integer> ivs(List<Integer> input) {
        if (input == null || input.size() != 6) {
            return new ArrayList<>();
        }
        List<Integer> out = new ArrayList<>(6);
        for (Integer iv : input) {
            out.add(Math.max(0, Math.min(32, iv == null ? 0 : iv)));
        }
        return out;
    }

    private static List<String> moves(List<String> input) {
        List<String> out = new ArrayList<>();
        if (input == null) {
            return out;
        }
        for (String m : input) {
            String s = str(m, 40);
            if (!s.isEmpty()) {
                out.add(s);
            }
            if (out.size() == 4) {
                break;
            }
        }
        return out;
    }
}
