package com.vpertz.media;

/**
 * Abstração de armazenamento de arquivos, para não acoplar o sistema a um
 * fornecedor. Hoje há a implementação local (disco/volume); um adaptador
 * S3/MinIO pode ser adicionado sem mudar quem chama.
 */
public interface StorageService {

    /** Salva os bytes e devolve a URL pública do arquivo (ex.: /media/xxx.png). */
    String store(byte[] data, String extension);
}
