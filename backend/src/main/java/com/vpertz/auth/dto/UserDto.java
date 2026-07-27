package com.vpertz.auth.dto;

/** Dados públicos do usuário (nunca expõe hash/salt). */
public record UserDto(String id, String username, String email, String role, String avatar) {
}
