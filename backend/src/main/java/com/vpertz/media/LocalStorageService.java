package com.vpertz.media;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/** Fallback para desenvolvimento sem serviço S3. */
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {
    private final Path dir;

    public LocalStorageService(@Value("${app.storage.dir}") String dir) {
        this.dir = Path.of(dir).toAbsolutePath().normalize();
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
    public void store(String objectKey, byte[] data, String contentType) {
        Path target = safePath(objectKey);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, data);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar o arquivo de mídia.", e);
        }
    }

    @Override
    public StoredObject load(String objectKey) {
        try {
            return new StoredObject(Files.readAllBytes(safePath(objectKey)), MediaTypes.fromObjectKey(objectKey));
        } catch (IOException e) {
            throw new MediaStorageException("Objeto de mídia não encontrado.", e);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            Files.deleteIfExists(safePath(objectKey));
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao remover o arquivo de mídia.", e);
        }
    }

    private Path safePath(String objectKey) {
        Path target = dir.resolve(objectKey).normalize();
        if (!target.startsWith(dir)) {
            throw new IllegalArgumentException("Chave de mídia inválida.");
        }
        return target;
    }
}
