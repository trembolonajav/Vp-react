package com.vpertz.admin;

import com.vpertz.admin.dto.AdminConfigRequest;
import com.vpertz.admin.dto.AdminModerationDtos.ReportView;
import com.vpertz.admin.dto.AdminModerationDtos.ReviewRequest;
import com.vpertz.auth.AuthService;
import com.vpertz.auth.dto.UserDto;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.config.dto.ConfigResponse;
import com.vpertz.chat.ChatService;
import com.vpertz.chat.dto.ChatDtos.ConversationDetail;
import com.vpertz.chat.dto.ChatDtos.ConversationsList;
import com.vpertz.chat.dto.ChatDtos.MessageDto;
import com.vpertz.chat.dto.ChatDtos.MessageRequest;
import com.vpertz.chat.dto.ChatDtos.StatusRequest;
import com.vpertz.chat.dto.ChatDtos.ConversationView;
import org.springframework.http.HttpStatus;
import com.vpertz.integrations.WhatsAppBridge;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.ListingStatusRequest;
import com.vpertz.listings.dto.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    private final ChatService chatService;
    private final WhatsAppBridge whatsAppBridge;

    public AdminController(
            AuthService authService,
            AdminConfigService adminConfigService,
            AdminModerationService moderationService,
            ChatService chatService,
            WhatsAppBridge whatsAppBridge) {
        this.authService = authService;
        this.adminConfigService = adminConfigService;
        this.moderationService = moderationService;
        this.chatService = chatService;
        this.whatsAppBridge = whatsAppBridge;
    }

    @GetMapping("/whatsapp/status")
    public ResponseEntity<JsonNode> whatsappStatus() { return ResponseEntity.ok(whatsAppBridge.get("/status")); }

    @GetMapping("/whatsapp/groups")
    public ResponseEntity<JsonNode> whatsappGroups() { return ResponseEntity.ok(whatsAppBridge.get("/groups")); }

    @PostMapping("/whatsapp/connect")
    public ResponseEntity<JsonNode> whatsappConnect() { return ResponseEntity.ok(whatsAppBridge.post("/connect", Map.of())); }

    @PostMapping("/whatsapp/disconnect")
    public ResponseEntity<JsonNode> whatsappDisconnect() { return ResponseEntity.ok(whatsAppBridge.post("/disconnect", Map.of())); }

    @PutMapping("/whatsapp/config")
    public ResponseEntity<JsonNode> whatsappConfig(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(whatsAppBridge.put("/config", body));
    }

    @PostMapping("/whatsapp/test")
    public ResponseEntity<JsonNode> whatsappTest() {
        return ResponseEntity.ok(whatsAppBridge.post("/send", Map.of("message", "✅ Teste de alertas do VP Bazaar.")));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ConversationsList> conversations(
            @RequestParam(defaultValue = "intermedio-solicitado") String status) {
        return ResponseEntity.ok(chatService.listForAdmin(status));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationDetail> conversation(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getDetailForAdmin(id));
    }

    /** O moderador do intermédio posta no chat (aparece para comprador e vendedor). */
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageDto> conversationMessage(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody MessageRequest request) {
        MessageDto msg = chatService.adminSendMessage(id, principal.userId(), principal.username(), request.text());
        return ResponseEntity.status(HttpStatus.CREATED).body(msg);
    }

    @PatchMapping("/conversations/{id}/status")
    public ResponseEntity<ConversationView> conversationStatus(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody StatusRequest request) {
        return ResponseEntity.ok(chatService.adminSetStatus(id, principal.userId(), principal.username(), request.status()));
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
