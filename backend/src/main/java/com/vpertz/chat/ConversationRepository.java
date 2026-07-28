package com.vpertz.chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, String> {
    List<Conversation> findByBuyerIdOrSellerId(String buyerId, String sellerId);
}
