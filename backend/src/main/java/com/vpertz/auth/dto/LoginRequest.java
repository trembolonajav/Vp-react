package com.vpertz.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Aceita username ou e-mail no campo login. */
public record LoginRequest(
        @NotBlank(message = "Informe o login.") String login,
        @NotBlank(message = "Informe a senha.") String password) {
}
