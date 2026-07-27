package com.vpertz.listings;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Anúncio do bazaar. Espelha o schema sanitizado pelo validate.mjs atual. */
@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Id público estável usado nas URLs (ex.: "anuncio-1"). */
    @Column(name = "public_id", nullable = false, length = 40, unique = true)
    private String publicId;

    @Column(nullable = false, length = 90)
    private String titulo;

    @Column(name = "game_id", length = 40)
    private String gameId;

    @Column(length = 40)
    private String servidor;

    @Column(length = 40)
    private String categoria;

    @Column(length = 16)
    private String tipo;

    @Column(nullable = false, length = 8)
    private String intencao = "venda";

    @Column(nullable = false, length = 10)
    private String moeda = "brl";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean negociavel;

    @Column(nullable = false)
    private boolean destaque;

    @Column(nullable = false, length = 10)
    private String status = "ativo";

    @Column(name = "img_url", length = 800)
    private String imgUrl;

    @Column(length = 1200)
    private String descricao;

    @Column(length = 60)
    private String vendedor;

    @Column(name = "criado_em")
    private LocalDate criadoEm;

    @Column(nullable = false)
    private int dex;

    @Column(nullable = false)
    private int nivel;

    @Column(nullable = false)
    private int poder;

    @Column(nullable = false)
    private boolean shiny;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "aceita_troca", nullable = false)
    private boolean aceitaTroca;

    @Column(length = 40)
    private String natureza;

    @Column(length = 40)
    private String habilidade;

    @Column(length = 10)
    private String genero;

    @Column(length = 40)
    private String forma;

    @Column(nullable = false, precision = 6, scale = 3)
    private BigDecimal qualidade = BigDecimal.ZERO;

    @Column(length = 20)
    private String disponibilidade;

    @Column(name = "iv_total")
    private Integer ivTotal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Integer> ivs = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> moves = new ArrayList<>();

    @Column(length = 800)
    private String regras;

    @ElementCollection
    @CollectionTable(name = "listing_types", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "type", length = 16, nullable = false)
    @BatchSize(size = 50)
    private List<String> tipos = new ArrayList<>();

    @Column(name = "vendedor_verificado", nullable = false)
    private boolean vendedorVerificado;

    @Column(name = "vendedor_online", nullable = false)
    private boolean vendedorOnline;

    @Column(name = "vendedor_nota", nullable = false, precision = 3, scale = 1)
    private BigDecimal vendedorNota = BigDecimal.ZERO;

    @Column(name = "vendedor_vendas", nullable = false)
    private int vendedorVendas;

    @Column(name = "vendedor_resposta", length = 40)
    private String vendedorResposta;

    @Column(name = "vendedor_avatar", length = 800)
    private String vendedorAvatar;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
