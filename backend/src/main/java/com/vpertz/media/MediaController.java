package com.vpertz.media;

import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.security.AuthPrincipal;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Upload autenticado e leitura pública de imagens armazenadas fora do banco. */
@RestController
public class MediaController {
    private static final long MAX_BYTES = 2_621_440;
    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/api/v1/media")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthPrincipal principal) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Arquivo vazio.");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (data.length > MAX_BYTES) {
            throw new ValidationException("Imagem grande demais (máx. 2,5MB).");
        }
        String extension = MediaSniffer.sniff(data);
        if (extension == null) {
            throw new ValidationException("Formato não aceito — envie PNG, JPG, WebP ou GIF.");
        }
        MediaAsset asset = mediaService.store(
                data, extension, file.getOriginalFilename(), principal.userId());
        return ResponseEntity.ok(Map.of(
                "id", asset.getId().toString(),
                "url", "/media/" + asset.getPublicId()));
    }

    @GetMapping("/media/{publicId:.+}")
    public ResponseEntity<byte[]> get(@PathVariable String publicId) {
        MediaService.MediaContent content = mediaService.load(publicId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic().immutable())
                .eTag("\"" + content.sha256() + "\"")
                .contentType(MediaType.parseMediaType(content.contentType()))
                .body(content.data());
    }
}
