package com.vpertz.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.vpertz.users.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Garante compatibilidade com o scrypt do Node e o caminho bcrypt. */
class PasswordServiceTest {

    // Vetor de referência gerado pelo Node: crypto.scryptSync(pass, salt, 64).
    private static final String SALT = "0123456789abcdef0123456789abcdef";
    private static final String PASS = "senha-Teste!2026";
    private static final String HASH =
            "108af435a48d7aa60bb2a69d1195430257f0c8774d7761c307260392013a7fd9"
          + "1253e01b9dd74eb00ced557957a32674eac08b7ff73c702224794d8e96786c76";

    private final PasswordService service = new PasswordService(new BCryptPasswordEncoder());

    @Test
    void verificaScryptLegadoCompativelComNode() {
        User user = scryptUser();
        assertThat(service.matches(user, PASS)).isTrue();
        assertThat(service.matches(user, "senha-errada")).isFalse();
        assertThat(service.isLegacy(user)).isTrue();
    }

    @Test
    void geraEVerificaBcrypt() {
        String hash = service.encode(PASS);
        User user = new User();
        user.setPasswordAlgo(PasswordService.ALGO_BCRYPT);
        user.setPasswordHash(hash);

        assertThat(hash).startsWith("$2");
        assertThat(service.matches(user, PASS)).isTrue();
        assertThat(service.matches(user, "outra")).isFalse();
        assertThat(service.isLegacy(user)).isFalse();
    }

    private static User scryptUser() {
        User user = new User();
        user.setPasswordAlgo(PasswordService.ALGO_SCRYPT);
        user.setPasswordSalt(SALT);
        user.setPasswordHash(HASH);
        return user;
    }
}
