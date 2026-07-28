package com.vpertz.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Conversa de negociação entre um comprador e um vendedor sobre um anúncio. */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "ad_id", length = 80)
    private String adId;

    @Column(length = 120)
    private String title;

    @Column(name = "buyer_id", length = 64)
    private String buyerId;

    @Column(name = "seller_id", length = 64)
    private String sellerId;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(nullable = false, length = 16)
    private String currency = "diamante";

    @Column(length = 200)
    private String details;

    @Column(nullable = false, length = 32)
    private String status = "aberta";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public boolean hasParticipant(String userId) {
        return userId != null && (userId.equals(buyerId) || userId.equals(sellerId));
    }
}
