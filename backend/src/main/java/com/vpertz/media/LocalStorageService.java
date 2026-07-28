package com.vpertz.media;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Armazena os arquivos no disco (um volume, em produção). */
@Service
public class LocalStorageService implements StorageService {

    private final Path dir;
    private final SecureRandom random = new SecureRandom();

    public LocalStorageService(@Value("${app.storage.dir}") String dir) {
        this.dir = Path.of(dir);
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar o diretório de mídia: " + dir, e);
        }
    }

    @Override
    public String store(byte[] data, String extension) {
        byte[] suffix = new byte[8];
        random.nextBytes(suffix);
        String name = "img-" + System.currentTimeMillis() + "-" + HexFormat.of().formatHex(suffix) + "." + extension;
        try {
            Files.write(dir.resolve(name), data);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar o arquivo de mídia.", e);
        }
        return "/media/" + name;
    }
}
