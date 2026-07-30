package com.vpertz.media;

import com.vpertz.common.exception.ResourceNotFoundException;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MediaService {
    private final StorageService storage;
    private final MediaAssetRepository repository;

    public MediaService(StorageService storage, MediaAssetRepository repository) {
        this.storage = storage;
        this.repository = repository;
    }

    @Transactional
    public MediaAsset store(byte[] data, String extension, String originalFilename, String userId) {
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String publicId = "img-" + id + "." + extension;
        String objectKey = "uploads/%d/%02d/%s".formatted(now.getYear(), now.getMonthValue(), publicId);
        String contentType = MediaTypes.fromExtension(extension);

        storage.store(objectKey, data, contentType);
        try {
            MediaAsset asset = new MediaAsset();
            asset.setId(id);
            asset.setPublicId(publicId);
            asset.setObjectKey(objectKey);
            asset.setOriginalFilename(cleanFilename(originalFilename));
            asset.setContentType(contentType);
            asset.setExtension(extension);
            asset.setByteSize(data.length);
            asset.setSha256(sha256(data));
            asset.setUploadedBy(userId);
            asset.setCreatedAt(now);
            return repository.saveAndFlush(asset);
        } catch (RuntimeException error) {
            storage.delete(objectKey);
            throw error;
        }
    }

    @Transactional(readOnly = true)
    public MediaContent load(String publicId) {
        MediaAsset asset = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Mídia não encontrada."));
        StorageService.StoredObject object = storage.load(asset.getObjectKey());
        return new MediaContent(object.data(), asset.getContentType(), asset.getSha256());
    }

    private static String cleanFilename(String filename) {
        if (filename == null || filename.isBlank()) return null;
        String clean = filename.replace('\\', '/');
        clean = clean.substring(clean.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "");
        return clean.substring(0, Math.min(clean.length(), 255));
    }

    private static String sha256(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 indisponível.", e);
        }
    }

    public record MediaContent(byte[] data, String contentType, String sha256) {
    }
}
