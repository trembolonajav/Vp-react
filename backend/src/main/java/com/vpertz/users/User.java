package com.vpertz.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Usuário da plataforma (admin do painel ou conta do bazaar). */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 24)
    private String username;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 200)
    private String passwordHash;

    @Column(name = "password_salt", length = 64)
    private String passwordSalt;

    /** "bcrypt" ou "scrypt" (legado, migrado para bcrypt no primeiro login). */
    @Column(name = "password_algo", nullable = false, length = 16)
    private String passwordAlgo = "bcrypt";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role = Role.USER;

    @Column(length = 800)
    private String avatar;

    @Column(length = 240)
    private String bio;

    @Column(length = 80)
    private String contact;

    @Column(name = "preferred_contact", nullable = false, length = 40)
    private String preferredContact = "Chat do Bazaar";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
