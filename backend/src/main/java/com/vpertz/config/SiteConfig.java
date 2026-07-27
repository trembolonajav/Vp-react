package com.vpertz.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Configuração global do site — sempre uma única linha (id = 1). */
@Entity
@Table(name = "site_config")
@Getter
@Setter
@NoArgsConstructor
public class SiteConfig {

    @Id
    private Short id = 1;

    @Column(nullable = false, length = 15)
    private String whatsapp;

    @Column(name = "msg_negociar", nullable = false, length = 300)
    private String msgNegociar;

    @Column(name = "bazaar_ativo", nullable = false)
    private boolean bazaarAtivo = true;

    @Column(name = "bazaar_msg_interesse", nullable = false, length = 300)
    private String bazaarMsgInteresse;

    @Column(name = "bazaar_msg_anunciar", nullable = false, length = 300)
    private String bazaarMsgAnunciar;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
