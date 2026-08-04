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
import java.math.BigDecimal;
import java.text.NumberFormat;
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
        String image = socialImage(listing, encodedId);
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
                <meta name="twitter:card" content="summary">
                <meta name="twitter:title" content="%s"><meta name="twitter:description" content="%s">
                <meta name="twitter:image" content="%s">
                <meta http-equiv="refresh" content="0;url=%s"></head>
                <body><a href="%s">Abrir anúncio</a></body></html>
                """.formatted(
                esc(title), esc(description), esc(target), esc(listing.getTitulo()), esc(description),
                esc(target), esc(image), esc(listing.getTitulo()), esc(description), esc(image),
                esc(target), esc(target));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic())
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    /** Usa a própria arte do anúncio para os mensageiros exibirem miniatura compacta. */
    private String socialImage(Listing listing, String encodedId) {
        String image = listing.getImgUrl();
        if (image != null && image.startsWith("https://")) {
            return image;
        }
        if (image != null && !image.isBlank()) {
            return publicBaseUrl + (image.startsWith("/") ? image : "/" + image);
        }
        return publicBaseUrl + "/api/v1/share/" + encodedId + "/image.png";
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
                ? ("diamonds".equals(listing.getMoeda()) ? "◆ " : "R$ ") + listing.getPreco().stripTrailingZeros().toPlainString()
                : "Preço a combinar";
        return java.util.stream.Stream.of(level, listing.getCategoria(), price, listing.getVendedor())
                .filter(value -> value != null && !value.isBlank())
                .collect(java.util.stream.Collectors.joining(" · "));
    }

    private static byte[] renderImage(Listing listing) {
        try {
            BufferedImage image = new BufferedImage(1200, 630, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setPaint(new java.awt.GradientPaint(0, 0, new Color(12, 7, 6), 1200, 630, new Color(88, 23, 20)));
            g.fillRect(0, 0, 1200, 630);
            g.setColor(new Color(138, 94, 39));
            g.drawRoundRect(18, 18, 1163, 593, 28, 28);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 27));
            g.setColor(new Color(218, 174, 82));
            g.drawString("VP BAZAAR", 64, 82);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 58));
            g.setColor(new Color(255, 241, 229));
            drawClipped(g, listing.getTitulo(), 64, 180, 1050);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 25));
            g.setColor(new Color(168, 145, 130));
            drawClipped(g, description(listing), 64, 260, 1050);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 54));
            g.setColor(new Color(232, 191, 100));
            String price = listing.getPreco() == null || listing.getPreco().signum() == 0
                    ? "Preço a combinar"
                    : ("diamonds".equals(listing.getMoeda()) ? "◆ " : "R$ ")
                        + NumberFormat.getNumberInstance(new Locale("pt", "BR")).format(listing.getPreco());
            drawClipped(g, price, 64, 480, 900);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 23));
            g.setColor(new Color(220, 200, 185));
            drawClipped(g, "vpertz.com.br · " + (listing.getVendedor() == null ? "Comunidade VP" : listing.getVendedor()),
                    64, 555, 1050);
            g.dispose();
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar a imagem de compartilhamento.", exception);
        }
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
