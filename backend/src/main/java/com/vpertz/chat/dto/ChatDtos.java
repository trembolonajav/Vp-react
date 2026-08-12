package com.vpertz.chat.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** DTOs do chat de negociação. */
public final class ChatDtos {

    private ChatDtos() {
    }

    public record MessageDto(
            String id,
            String conversationId,
            String author,
            String authorId,
            String text,
            OffsetDateTime createdAt) {
    }

    public record ConversationView(
            String id,
            String adId,
            String title,
            String buyer,
            String seller,
            String image,
            BigDecimal price,
            String currency,
            String details,
            String status,
            boolean intermediaryUsed,
            boolean buyerProductConfirmed,
            boolean sellerPaymentConfirmed,
            String negotiationMode,
            boolean vpItemReceived,
            boolean vpPaymentReceived,
            boolean vpItemDelivered,
            boolean vpPaymentDelivered,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {
    }

    public record ConversationSummary(
            ConversationView conversation,
            MessageDto lastMessage,
            int unread) {
    }

    public record ConversationDetail(
            ConversationView conversation,
            List<MessageDto> messages,
            List<NegotiationEventDto> events) {
    }

    public record NegotiationEventDto(String id, String type, String actor, String details, OffsetDateTime createdAt) { }

    public record ConversationsList(
            List<ConversationSummary> conversations,
            int unread) {
    }

    public record StartRequest(
            String adId,
            String seller,
            String title,
            String image,
            BigDecimal price,
            String currency,
            String details) {
    }

    public record MessageRequest(String text) {
    }

    public record StatusRequest(String status) {
    }
}
