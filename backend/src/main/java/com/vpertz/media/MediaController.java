package com.vpertz.media;

import com.vpertz.common.exception.ValidationException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Upload de imagens (autenticado). Valida o formato real e devolve a URL. */
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private static final long MAX_BYTES = 2_621_440; // 2,5 MB

    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
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
        String ext = MediaSniffer.sniff(data);
        if (ext == null) {
            throw new ValidationException("Formato não aceito — envie PNG, JPG, WebP ou GIF.");
        }
        return ResponseEntity.ok(Map.of("url", storageService.store(data, ext)));
    }
}
