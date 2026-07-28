package com.vpertz.media;

/** Detecta o formato real da imagem pelos magic bytes (o Content-Type não é confiável). */
final class MediaSniffer {

    private MediaSniffer() {
    }

    /** Extensão detectada (png/jpg/webp/gif) ou null se o formato não for aceito. */
    static String sniff(byte[] b) {
        if (b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) {
            return "png";
        }
        if (b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length > 12 && ascii(b, 0, 4).equals("RIFF") && ascii(b, 8, 12).equals("WEBP")) {
            return "webp";
        }
        if (b.length > 6 && ascii(b, 0, 4).equals("GIF8")) {
            return "gif";
        }
        return null;
    }

    private static String ascii(byte[] b, int from, int to) {
        return new String(b, from, to - from, java.nio.charset.StandardCharsets.US_ASCII);
    }
}
