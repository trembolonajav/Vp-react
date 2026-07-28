package com.vpertz.chat;

import com.vpertz.chat.dto.ChatDtos.ConversationDetail;
import com.vpertz.chat.dto.ChatDtos.ConversationView;
import com.vpertz.chat.dto.ChatDtos.ConversationsList;
import com.vpertz.chat.dto.ChatDtos.MessageDto;
import com.vpertz.chat.dto.ChatDtos.MessageRequest;
import com.vpertz.chat.dto.ChatDtos.StartRequest;
import com.vpertz.chat.dto.ChatDtos.StatusRequest;
import com.vpertz.common.security.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Chat de negociação (autenticado; só participantes acessam a conversa). */
@RestController
@RequestMapping("/api/v1/conversations")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public ResponseEntity<ConversationsList> minhas(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(chatService.listMine(principal.userId()));
    }

    @PostMapping
    public ResponseEntity<ConversationView> start(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody StartRequest request) {
        return ResponseEntity.ok(chatService.start(principal.userId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDetail> detalhe(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(chatService.getDetail(id, principal.userId()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDto> enviar(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody MessageRequest request) {
        MessageDto message = chatService.sendMessage(id, principal.userId(), principal.username(), request.text());
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> marcarLido(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal) {
        chatService.markRead(id, principal.userId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ConversationView> status(
            @PathVariable String id,
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody StatusRequest request) {
        return ResponseEntity.ok(chatService.setStatus(id, principal.userId(), request.status()));
    }
}
