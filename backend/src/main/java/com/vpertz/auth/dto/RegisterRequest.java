package com.vpertz.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Pattern(regexp = "^[a-zA-Z0-9_.-]{3,24}$", message = "Use de 3 a 24 caracteres (letras, números, _.-).")
        String username,

        @NotBlank @Email(message = "Informe um e-mail válido.")
        String email,

        @NotBlank @Size(min = 8, message = "A senha precisa ter pelo menos 8 caracteres.")
        String password) {
}
