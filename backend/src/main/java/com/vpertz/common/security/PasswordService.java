package com.vpertz.common.security;

import com.vpertz.users.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Verificação e geração de senhas. Suporta bcrypt (padrão novo) e a
 * verificação dos hashes scrypt legados gerados pelo crypto do Node
 * (scryptSync(password, saltHex, 64) com N=16384, r=8, p=1).
 */
@Component
public class PasswordService {

    private static final int SCRYPT_N = 16384;
    private static final int SCRYPT_R = 8;
    private static final int SCRYPT_P = 1;
    private static final int SCRYPT_KEYLEN = 64;

    public static final String ALGO_BCRYPT = "bcrypt";
    public static final String ALGO_SCRYPT = "scrypt";

    private final PasswordEncoder bcrypt;

    public PasswordService(PasswordEncoder bcrypt) {
        this.bcrypt = bcrypt;
    }

    public boolean matches(User user, String rawPassword) {
        if (ALGO_SCRYPT.equals(user.getPasswordAlgo())) {
            return scryptMatches(rawPassword, user.getPasswordSalt(), user.getPasswordHash());
        }
        return bcrypt.matches(rawPassword, user.getPasswordHash());
    }

    public boolean isLegacy(User user) {
        return ALGO_SCRYPT.equals(user.getPasswordAlgo());
    }

    public String encode(String rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    /**
     * Reproduz o Node: o salt é a STRING hex usada como bytes UTF-8 (não o hex
     * decodificado), a senha em UTF-8, e o resultado comparado em hexadecimal.
     */
    private boolean scryptMatches(String rawPassword, String saltHex, String expectedHex) {
        if (saltHex == null || expectedHex == null) {
            return false;
        }
        byte[] derived = SCrypt.generate(
                rawPassword.getBytes(StandardCharsets.UTF_8),
                saltHex.getBytes(StandardCharsets.UTF_8),
                SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_KEYLEN);
        String derivedHex = HexFormat.of().formatHex(derived);
        return MessageDigest.isEqual(
                derivedHex.getBytes(StandardCharsets.UTF_8),
                expectedHex.getBytes(StandardCharsets.UTF_8));
    }
}
