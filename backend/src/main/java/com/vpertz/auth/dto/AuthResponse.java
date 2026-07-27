package com.vpertz.auth.dto;

public record AuthResponse(String token, UserDto user) {
}
