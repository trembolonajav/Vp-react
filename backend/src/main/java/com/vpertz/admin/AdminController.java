package com.vpertz.admin;

import com.vpertz.admin.dto.AdminConfigRequest;
import com.vpertz.admin.dto.AdminModerationDtos.ReportView;
import com.vpertz.admin.dto.AdminModerationDtos.ReviewRequest;
import com.vpertz.auth.AuthService;
import com.vpertz.auth.dto.UserDto;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.config.dto.ConfigResponse;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.ListingStatusRequest;
import com.vpertz.listings.dto.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Área do painel (exige ROLE_ADMIN via SecurityConfig). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AuthService authService;
    private final AdminConfigService adminConfigService;
    private final AdminModerationService moderationService;

    public AdminController(
            AuthService authService,
            AdminConfigService adminConfigService,
            AdminModerationService moderationService) {
        this.authService = authService;
        this.adminConfigService = adminConfigService;
        this.moderationService = moderationService;
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

    @GetMapping("/reports")
    public ResponseEntity<PageResponse<ReportView>> reports(
            @RequestParam(defaultValue = "aberta") String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(moderationService.reports(status, page, size));
    }

    @PatchMapping("/reports/{id}")
    public ResponseEntity<ReportView> review(
            @PathVariable String id,
            @RequestBody ReviewRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(moderationService.review(id, request, principal));
    }

    @GetMapping("/listings")
    public ResponseEntity<PageResponse<ListingResponse>> listings(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "todos") String status,
            @RequestParam(defaultValue = "recentes") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(moderationService.listings(q, status, sort, page, size));
    }

    @PatchMapping("/listings/{publicId}/status")
    public ResponseEntity<ListingResponse> listingStatus(
            @PathVariable String publicId,
            @RequestBody ListingStatusRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(moderationService.updateListingStatus(publicId, request.status(), principal));
    }
}
