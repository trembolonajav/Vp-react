package com.vpertz.users;

import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.users.dto.ProfileDtos.ProfileResponse;
import com.vpertz.users.dto.ProfileDtos.ProfileUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /** Perfil público de um usuário (leitura aberta). */
    @GetMapping("/{username}")
    public ResponseEntity<ProfileResponse> publico(@PathVariable String username) {
        return ResponseEntity.ok(profileService.getPublic(username));
    }

    /** Perfil pertencente ao token atual; o cliente não fornece identidade. */
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> meuPerfil(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(profileService.getMe(principal.userId()));
    }

    /** Atualiza o próprio perfil (autenticado). */
    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> atualizar(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateMe(principal.userId(), request));
    }
}
