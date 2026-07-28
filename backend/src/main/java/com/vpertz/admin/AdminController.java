package com.vpertz.admin;

import com.vpertz.admin.dto.AdminConfigRequest;
import com.vpertz.auth.AuthService;
import com.vpertz.auth.dto.UserDto;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.config.dto.ConfigResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Área do painel (exige ROLE_ADMIN via SecurityConfig). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AuthService authService;
    private final AdminConfigService adminConfigService;

    public AdminController(AuthService authService, AdminConfigService adminConfigService) {
        this.authService = authService;
        this.adminConfigService = adminConfigService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal.userId()));
    }

    /** Salva a configuração do site (loja, banners, contatos, taxonomia). */
    @PutMapping("/config")
    public ResponseEntity<ConfigResponse> saveConfig(@RequestBody AdminConfigRequest request) {
        return ResponseEntity.ok(adminConfigService.replace(request));
    }
}
