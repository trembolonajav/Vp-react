package com.vpertz.media;

/** Abstração de objetos binários, independente do fornecedor S3 ou disco local. */
public interface StorageService {
    void store(String objectKey, byte[] data, String contentType);

    StoredObject load(String objectKey);

    void delete(String objectKey);

    record StoredObject(byte[] data, String contentType) {
    }
}
