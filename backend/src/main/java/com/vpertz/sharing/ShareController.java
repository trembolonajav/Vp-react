package com.vpertz.sharing;

import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.common.exception.ResourceNotFoundException;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.time.Duration;
import java.util.Set;
import java.util.Locale;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriUtils;

@RestController
@RequestMapping("/api/v1/share")
public class ShareController {
    private static final Set<String> TRUSTED_IMAGE_HOSTS = Set.of(
            "poke.idleworld.online", "raw.githubusercontent.com");
    private final ListingRepository listingRepository;
    private final String publicBaseUrl;

    public ShareController(
            ListingRepository listingRepository,
            @Value("${app.public-base-url}") String publicBaseUrl) {
        this.listingRepository = listingRepository;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    @GetMapping(value = "/{listingId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> share(@PathVariable String listingId) {
        Listing listing = requireListing(listingId);
        String encodedId = UriUtils.encodePathSegment(listing.getPublicId(), java.nio.charset.StandardCharsets.UTF_8);
        String target = publicBaseUrl + "/bazaar/anuncio/" + encodedId;
        String image = socialImage(encodedId);
        String title = listing.getTitulo() + " — VP Bazaar";
        String description = description(listing);
        String html = """
                <!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <title>%s</title><meta name="description" content="%s">
                <link rel="canonical" href="%s">
                <meta property="og:type" content="website"><meta property="og:site_name" content="VP Bazaar">
                <meta property="og:title" content="%s"><meta property="og:description" content="%s">
                <meta property="og:url" content="%s"><meta property="og:image" content="%s">
                <meta property="og:image:secure_url" content="%s"><meta property="og:image:type" content="image/png">
                <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
                <meta property="og:image:alt" content="%s">
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="%s"><meta name="twitter:description" content="%s">
                <meta name="twitter:image" content="%s">
                <meta http-equiv="refresh" content="0;url=%s"></head>
                <body><a href="%s">Abrir anúncio</a></body></html>
                """.formatted(
                esc(title), esc(description), esc(target), esc(listing.getTitulo()), esc(description),
                esc(target), esc(image), esc(image), esc(listing.getTitulo()), esc(listing.getTitulo()), esc(description), esc(image),
                esc(target), esc(target));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic())
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    /** Entrega uma arte 1200x630 consistente, em vez de sprites pequenos usados como thumbnail. */
    private String socialImage(String encodedId) {
        return publicBaseUrl + "/api/v1/share/" + encodedId + "/image.png?v=3";
    }

    @GetMapping(value = "/{listingId}/image.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> image(@PathVariable String listingId) {
        Listing listing = requireListing(listingId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
                .contentType(MediaType.IMAGE_PNG)
                .body(renderImage(listing));
    }

    private Listing requireListing(String listingId) {
        return listingRepository.findByPublicId(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado."));
    }

    private static String description(Listing listing) {
        String level = listing.getNivel() > 0 ? "Nv. " + listing.getNivel() : "";
        String price = listing.getPreco() != null && listing.getPreco().compareTo(BigDecimal.ZERO) > 0
                ? ("diamonds".equals(listing.getMoeda()) ? "💎 " : "R$ ") + listing.getPreco().stripTrailingZeros().toPlainString()
                : "Preço a combinar";
        return java.util.stream.Stream.of(level, listing.getCategoria(), price, listing.getVendedor())
                .filter(value -> value != null && !value.isBlank())
                .collect(java.util.stream.Collectors.joining(" · "));
    }

    private byte[] renderImage(Listing listing) {
        try {
            BufferedImage image = new BufferedImage(1200, 630, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setPaint(new java.awt.GradientPaint(0, 0, new Color(12, 7, 6), 1200, 630, new Color(88, 23, 20)));
            g.fillRect(0, 0, 1200, 630);
            g.setColor(new Color(138, 94, 39));
            g.drawRoundRect(18, 18, 1163, 593, 28, 28);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 25));
            g.setColor(new Color(218, 174, 82));
            g.drawString("VP BAZAAR", 55, 66);

            BufferedImage artwork = loadArtwork(listing.getImgUrl());
            if (artwork != null) {
                drawContained(g, artwork, 330, 70, 600, 400);
            }

            g.setFont(new Font(Font.SERIF, Font.BOLD, 43));
            g.setColor(new Color(255, 241, 229));
            drawClipped(g, listing.getTitulo(), 55, 500, 760);

            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 21));
            g.setColor(new Color(188, 166, 151));
            drawClipped(g, details(listing), 55, 550, 760);

            String price = listing.getPreco() == null || listing.getPreco().signum() == 0
                    ? "A COMBINAR"
                    : NumberFormat.getNumberInstance(new Locale("pt", "BR")).format(listing.getPreco());
            if ("diamonds".equals(listing.getMoeda())) {
                drawDiamond(g, 945, 518, 26);
            }
            g.setFont(new Font(Font.SERIF, Font.BOLD, 43));
            g.setColor(new Color(232, 191, 100));
            drawClipped(g, ("diamonds".equals(listing.getMoeda()) ? "" : "R$ ") + price,
                    "diamonds".equals(listing.getMoeda()) ? 982 : 900, 550, 175);
            g.dispose();
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar a imagem de compartilhamento.", exception);
        }
    }

    private static String details(Listing listing) {
        boolean pokemon = "pokemon".equalsIgnoreCase(listing.getTipo()) || listing.getDex() > 0;
        if (pokemon) {
            String quality = listing.getQualidade() == null ? "0,00"
                    : listing.getQualidade().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace('.', ',');
            return "QUALIDADE " + quality + "   ·   IV " + (listing.getIvTotal() == null ? 0 : listing.getIvTotal())
                    + "/192   ·   LV. " + listing.getNivel();
        }
        String category = listing.getCategoria() == null ? "ITEM" : listing.getCategoria().toUpperCase(Locale.ROOT);
        return category + "   ·   CONSUMÍVEL   ·   " + Math.max(1, listing.getQuantidade()) + " UN.";
    }

    private BufferedImage loadArtwork(String value) {
        try {
            if (value == null || value.isBlank()) return null;
            URI uri = URI.create(value.startsWith("/") ? publicBaseUrl + value : value);
            URI base = URI.create(publicBaseUrl);
            boolean sameOrigin = uri.getHost() != null && uri.getHost().equalsIgnoreCase(base.getHost());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || (!sameOrigin && !TRUSTED_IMAGE_HOSTS.contains(uri.getHost()))) {
                return null;
            }
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(3)).GET().build();
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() / 100 != 2 || response.body().length > 5_000_000) return null;
            return ImageIO.read(new ByteArrayInputStream(response.body()));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static void drawContained(Graphics2D g, BufferedImage source, int x, int y, int width, int height) {
        double scale = Math.min((double) width / source.getWidth(), (double) height / source.getHeight());
        int drawWidth = Math.max(1, (int) (source.getWidth() * scale));
        int drawHeight = Math.max(1, (int) (source.getHeight() * scale));
        g.drawImage(source, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight, null);
    }

    private static void drawDiamond(Graphics2D g, int x, int y, int size) {
        int[] xs = {x, x + size / 2, x + size, x + size / 2};
        int[] ys = {y + size / 3, y, y + size / 3, y + size};
        g.setColor(new Color(54, 190, 255));
        g.fillPolygon(xs, ys, 4);
        g.setColor(new Color(180, 238, 255));
        g.drawPolygon(xs, ys, 4);
        g.drawLine(x, y + size / 3, x + size, y + size / 3);
        g.drawLine(x + size / 2, y, x + size / 2, y + size);
    }

    private static void drawClipped(Graphics2D g, String value, int x, int y, int maxWidth) {
        String text = value == null ? "" : value;
        while (text.length() > 1 && g.getFontMetrics().stringWidth(text) > maxWidth) {
            text = text.substring(0, text.length() - 1);
        }
        g.drawString(text.equals(value) ? text : text + "…", x, y);
    }

    private static String esc(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
