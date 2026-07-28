package com.vpertz.reports;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Denúncia de um anúncio feita por um usuário. */
@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "ad_id", nullable = false, length = 80)
    private String adId;

    @Column(length = 120)
    private String title;

    @Column(length = 40)
    private String seller;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(length = 600)
    private String details;

    @Column(name = "reporter_id", length = 64)
    private String reporterId;

    @Column(nullable = false, length = 16)
    private String status = "aberta";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
