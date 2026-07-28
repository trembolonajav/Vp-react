package com.vpertz.admin;

import com.vpertz.common.exception.ValidationException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Saneamento server-side da configuração do site, portando as regras do
 * sanitizeConfig do validate.mjs. Nada é persistido sem passar por aqui.
 */
final class ConfigSanitizer {

    static final Set<String> ICON_KEYS = Set.of(
            "instagram", "youtube", "twitch", "whatsapp", "tiktok", "discord",
            "x", "telegram", "facebook", "kick", "email", "site");

    private static final Pattern IMG_ASSET = Pattern.compile("^assets/[\\w\\-./]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_UPLOAD = Pattern.compile("^/uploads/[\\w\\-.]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_MEDIA = Pattern.compile("^/media/[\\w\\-.]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMG_HTTPS = Pattern.compile("^https://[^\\s\"'<>]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINK_HTTP = Pattern.compile("^https?://[^\\s\"'<>]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINK_PAGE = Pattern.compile("^[\\w\\-./]+\\.html([?#][^\\s\"'<>]*)?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINK_ANCHOR = Pattern.compile("^#[\\w-]*$");

    private ConfigSanitizer() {
    }

    static String whatsapp(String value) {
        String digits = (value == null ? "" : value).replaceAll("\\D", "");
        if (digits.length() > 15) {
            digits = digits.substring(0, 15);
        }
        if (digits.length() < 10) {
            throw new ValidationException("Número de WhatsApp inválido (use 55 + DDD + número).");
        }
        return digits;
    }

    static String str(String value, int max) {
        if (value == null) {
            return "";
        }
        String cleaned = value.replaceAll("[<>]", "").trim();
        return cleaned.length() > max ? cleaned.substring(0, max) : cleaned;
    }

    static String strOr(String value, int max, String fallback) {
        String s = str(value, max);
        return s.isEmpty() ? fallback : s;
    }

    static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }

    static BigDecimal num(BigDecimal value, long min, long max, int scale) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value;
        v = v.max(BigDecimal.valueOf(min)).min(BigDecimal.valueOf(max));
        return v.setScale(scale, RoundingMode.HALF_UP);
    }

    static int intv(Integer value, int min, int max) {
        int v = value == null ? min : value;
        return Math.max(min, Math.min(max, v));
    }

    static String icon(String value) {
        return value != null && ICON_KEYS.contains(value) ? value : "site";
    }

    static String gameId(String value, int index) {
        String id = (value == null ? "" : value).toLowerCase().replaceAll("[^a-z0-9-]", "");
        if (id.length() > 40) {
            id = id.substring(0, 40);
        }
        return id.isEmpty() ? "jogo-" + (index + 1) : id;
    }

    static String imgUrl(String value) {
        String s = (value == null ? "" : value).trim();
        if (s.length() > 800) {
            s = s.substring(0, 800);
        }
        if (IMG_ASSET.matcher(s).matches() || IMG_UPLOAD.matcher(s).matches()
                || IMG_MEDIA.matcher(s).matches() || IMG_HTTPS.matcher(s).matches()) {
            return s;
        }
        return "";
    }

    static String linkUrl(String value) {
        String s = (value == null ? "" : value).trim();
        if (s.isEmpty()) {
            return "";
        }
        if (s.length() > 500) {
            s = s.substring(0, 500);
        }
        if (LINK_HTTP.matcher(s).matches() || LINK_PAGE.matcher(s).matches() || LINK_ANCHOR.matcher(s).matches()) {
            return s;
        }
        return "";
    }

    /** Lista de rótulos curtos (servidores/categorias) sem vazios nem duplicados. */
    static List<String> labelList(List<String> input, int max, int maxLen) {
        List<String> out = new ArrayList<>();
        if (input == null) {
            return out;
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String raw : input) {
            if (out.size() >= max) {
                break;
            }
            String label = str(raw, maxLen);
            String key = label.toLowerCase();
            if (label.isEmpty() || seen.contains(key)) {
                continue;
            }
            seen.add(key);
            out.add(label);
        }
        return out;
    }
}
