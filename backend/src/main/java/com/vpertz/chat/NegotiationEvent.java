package com.vpertz.chat;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "negotiation_events") @Getter @Setter @NoArgsConstructor
public class NegotiationEvent {
    @Id @Column(length = 64) private String id;
    @Column(name = "conversation_id", nullable = false, length = 64) private String conversationId;
    @Column(nullable = false, length = 64) private String type;
    @Column(name = "actor_id", length = 64) private String actorId;
    @Column(name = "actor_name", nullable = false, length = 80) private String actorName = "Sistema";
    @Column(length = 500) private String details;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt = OffsetDateTime.now();
}
