package com.vpertz.media;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

/** Detecção de formato por magic bytes (o Content-Type do cliente não é confiável). */
class MediaSnifferTest {

    @Test
    void detectaFormatosValidos() {
        byte[] png = pad(new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        byte[] jpg = pad(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0});
        byte[] gif = pad("GIF89a".getBytes(StandardCharsets.US_ASCII));
        byte[] webp = webp();

        assertThat(MediaSniffer.sniff(png)).isEqualTo("png");
        assertThat(MediaSniffer.sniff(jpg)).isEqualTo("jpg");
        assertThat(MediaSniffer.sniff(gif)).isEqualTo("gif");
        assertThat(MediaSniffer.sniff(webp)).isEqualTo("webp");
    }

    @Test
    void rejeitaFormatosNaoImagem() {
        assertThat(MediaSniffer.sniff("<html>".getBytes(StandardCharsets.US_ASCII))).isNull();
        assertThat(MediaSniffer.sniff(new byte[] {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})).isNull();
        assertThat(MediaSniffer.sniff(new byte[] {1, 2})).isNull();
    }

    private static byte[] webp() {
        byte[] b = new byte[16];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, b, 0, 4);
        System.arraycopy("WEBP".getBytes(StandardCharsets.US_ASCII), 0, b, 8, 4);
        return b;
    }

    private static byte[] pad(byte[] header) {
        byte[] out = new byte[Math.max(16, header.length)];
        System.arraycopy(header, 0, out, 0, header.length);
        return out;
    }
}
