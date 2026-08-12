package com.vpertz.chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NegotiationEventRepository extends JpaRepository<NegotiationEvent, String> {
    List<NegotiationEvent> findByConversationIdOrderByCreatedAtAsc(String conversationId);
}
