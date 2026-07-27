package com.vpertz.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Jogo da loja. O id é o slug estável usado hoje no config.json (ex.: "pokeidle"). */
@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
public class Game {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, length = 80)
    private String item;

    @Column(nullable = false, length = 40)
    private String unidade;

    @Column(nullable = false, length = 80)
    private String botao;

    @Column(name = "img_url", nullable = false, length = 800)
    private String imgUrl;

    @Column(name = "icone_url", length = 800)
    private String iconeUrl;

    @Column(name = "preco_compra", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoCompra = BigDecimal.ZERO;

    @Column(name = "preco_venda", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoVenda = BigDecimal.ZERO;

    @Column(name = "min_qtd", nullable = false)
    private int minQtd = 1;

    @Column(name = "max_qtd", nullable = false)
    private int maxQtd = 1;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private int ordering = 0;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
