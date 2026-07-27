package com.vpertz.taxonomy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Servidor de jogo listado no bazaar (mapeado para a tabela "servers"). */
@Entity
@Table(name = "servers")
@Getter
@Setter
@NoArgsConstructor
public class GameServer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40, unique = true)
    private String nome;

    @Column(nullable = false)
    private int ordering = 0;
}
