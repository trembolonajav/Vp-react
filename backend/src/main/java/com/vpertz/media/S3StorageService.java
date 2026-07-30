package com.vpertz.media;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/** Armazena objetos em qualquer endpoint compatível com a API S3, incluindo MinIO. */
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {
    private final MinioClient client;
    private final String bucket;

    public S3StorageService(
            @Value("${app.storage.s3.endpoint}") String endpoint,
            @Value("${app.storage.s3.access-key}") String accessKey,
            @Value("${app.storage.s3.secret-key}") String secretKey,
            @Value("${app.storage.s3.bucket}") String bucket) {
        this.client = MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey).build();
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucket() {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new MediaStorageException("Não foi possível preparar o bucket de mídia.", e);
        }
    }

    @Override
    public void store(String objectKey, byte[] data, String contentType) {
        try (ByteArrayInputStream input = new ByteArrayInputStream(data)) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket).object(objectKey).contentType(contentType)
                    .stream(input, (long) data.length, -1L).build());
        } catch (Exception e) {
            throw new MediaStorageException("Falha ao salvar o objeto de mídia.", e);
        }
    }

    @Override
    public StoredObject load(String objectKey) {
        try (var response = client.getObject(GetObjectArgs.builder().bucket(bucket).object(objectKey).build())) {
            String contentType = response.headers().get("Content-Type");
            return new StoredObject(response.readAllBytes(),
                    contentType == null ? MediaTypes.fromObjectKey(objectKey) : contentType);
        } catch (Exception e) {
            throw new MediaStorageException("Objeto de mídia não encontrado.", e);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception e) {
            throw new MediaStorageException("Falha ao remover o objeto de mídia.", e);
        }
    }
}
