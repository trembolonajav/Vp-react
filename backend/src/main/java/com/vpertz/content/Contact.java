package com.vpertz.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Contato / rede social exibido na página de contato, rodapé e chips. */
@Entity
@Table(name = "contacts")
@Getter
@Setter
@NoArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String icone;

    @Column(length = 40)
    private String nome;

    @Column(length = 120)
    private String info;

    @Column(length = 500)
    private String url;

    @Column(nullable = false)
    private int ordering = 0;
}
