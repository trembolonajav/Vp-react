package com.vpertz.admin;

import com.vpertz.auth.AuthService;
import com.vpertz.auth.dto.UserDto;
import com.vpertz.common.security.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Área do painel (exige ROLE_ADMIN via SecurityConfig). Por ora só confirma a
 * identidade do admin; a edição de config/anúncios entra na fase de admin.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal.userId()));
    }
}
