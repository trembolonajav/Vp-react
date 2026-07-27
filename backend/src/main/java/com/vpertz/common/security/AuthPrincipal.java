package com.vpertz.common.security;

/** Identidade do usuário autenticado, extraída do JWT. */
public record AuthPrincipal(String userId, String username, String role) {
}
