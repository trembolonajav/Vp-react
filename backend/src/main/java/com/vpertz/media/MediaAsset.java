package com.vpertz.media;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "media_assets")
@Getter
@Setter
@NoArgsConstructor
public class MediaAsset {
    @Id
    private UUID id;

    @Column(name = "public_id", nullable = false, unique = true, length = 80)
    private String publicId;

    @Column(name = "object_key", nullable = false, unique = true, length = 300)
    private String objectKey;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", nullable = false, length = 80)
    private String contentType;

    @Column(nullable = false, length = 8)
    private String extension;

    @Column(name = "byte_size", nullable = false)
    private long byteSize;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "uploaded_by", nullable = false, length = 64)
    private String uploadedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
