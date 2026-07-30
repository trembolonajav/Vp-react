package com.vpertz.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.common.exception.ResourceNotFoundException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {
    @Mock private StorageService storage;
    @Mock private MediaAssetRepository repository;
    private MediaService service;

    @BeforeEach
    void setUp() {
        service = new MediaService(storage, repository);
    }

    @Test
    void gravaObjetoPrivadoEMetadadosComChecksum() {
        byte[] data = "imagem".getBytes(StandardCharsets.UTF_8);
        when(repository.saveAndFlush(any(MediaAsset.class))).thenAnswer(call -> call.getArgument(0));

        MediaAsset asset = service.store(data, "png", "../foto.png", "user-1");

        ArgumentCaptor<String> key = ArgumentCaptor.forClass(String.class);
        verify(storage).store(key.capture(), org.mockito.ArgumentMatchers.eq(data), org.mockito.ArgumentMatchers.eq("image/png"));
        assertThat(key.getValue()).matches("uploads/\\d{4}/\\d{2}/img-[\\w-]+\\.png");
        assertThat(asset.getPublicId()).matches("img-[\\w-]+\\.png");
        assertThat(asset.getOriginalFilename()).isEqualTo("foto.png");
        assertThat(asset.getUploadedBy()).isEqualTo("user-1");
        assertThat(asset.getSha256()).hasSize(64);
    }

    @Test
    void removeObjetoSePersistenciaFalhar() {
        when(repository.saveAndFlush(any(MediaAsset.class))).thenThrow(new IllegalStateException("db"));

        assertThatThrownBy(() -> service.store(new byte[] {1}, "png", "a.png", "user-1"))
                .isInstanceOf(IllegalStateException.class);

        ArgumentCaptor<String> key = ArgumentCaptor.forClass(String.class);
        verify(storage).delete(key.capture());
        assertThat(key.getValue()).endsWith(".png");
    }

    @Test
    void carregaObjetoPeloIdentificadorPublico() {
        MediaAsset asset = new MediaAsset();
        asset.setPublicId("img-1.webp");
        asset.setObjectKey("uploads/2026/07/img-1.webp");
        asset.setContentType("image/webp");
        asset.setSha256("abc");
        when(repository.findByPublicId("img-1.webp")).thenReturn(Optional.of(asset));
        when(storage.load(asset.getObjectKey()))
                .thenReturn(new StorageService.StoredObject(new byte[] {1, 2}, "image/webp"));

        MediaService.MediaContent content = service.load("img-1.webp");

        assertThat(content.data()).containsExactly(1, 2);
        assertThat(content.contentType()).isEqualTo("image/webp");
        assertThat(content.sha256()).isEqualTo("abc");
    }

    @Test
    void rejeitaIdentificadorSemMetadados() {
        when(repository.findByPublicId("ausente.png")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.load("ausente.png"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
