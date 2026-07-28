package com.vpertz.chat;

import com.vpertz.chat.dto.ChatDtos.ConversationDetail;
import com.vpertz.chat.dto.ChatDtos.ConversationSummary;
import com.vpertz.chat.dto.ChatDtos.ConversationView;
import com.vpertz.chat.dto.ChatDtos.ConversationsList;
import com.vpertz.chat.dto.ChatDtos.MessageDto;
import com.vpertz.chat.dto.ChatDtos.StartRequest;
import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.users.User;
import com.vpertz.users.UserRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChatService {

    private static final Set<String> STATUS = Set.of("aberta", "intermedio-solicitado", "concluida", "encerrada");
    private static final Set<String> CURRENCIES = Set.of("diamante", "pix");

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    ChatService(ConversationRepository conversationRepository,
               MessageRepository messageRepository,
               UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ConversationsList listMine(String userId) {
        List<Conversation> conversas = conversationRepository.findByBuyerIdOrSellerId(userId, userId);
        Map<String, String> nomes = usernames(conversas.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getBuyerId(), c.getSellerId()))
                .collect(Collectors.toSet()));

        List<ConversationSummary> resumos = conversas.stream()
                .map(c -> {
                    List<Message> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
                    Message ultima = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
                    int naoLidas = (int) msgs.stream()
                            .filter(m -> !userId.equals(m.getAuthorId()) && !m.getReadBy().contains(userId))
                            .count();
                    return new ConversationSummary(view(c, nomes), ultima == null ? null : message(ultima, nomes), naoLidas);
                })
                .sorted(Comparator.comparing(
                        (ConversationSummary s) -> s.lastMessage() != null
                                ? s.lastMessage().createdAt()
                                : s.conversation().createdAt())
                        .reversed())
                .toList();

        int total = resumos.stream().mapToInt(ConversationSummary::unread).sum();
        return new ConversationsList(resumos, total);
    }

    @Transactional(readOnly = true)
    public ConversationDetail getDetail(String conversationId, String userId) {
        Conversation conversa = requireParticipant(conversationId, userId);
        Map<String, String> nomes = usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        List<MessageDto> mensagens = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(m -> message(m, nomes))
                .toList();
        return new ConversationDetail(view(conversa, nomes), mensagens);
    }

    @Transactional
    public ConversationView start(String userId, StartRequest req) {
        String sellerName = req.seller() == null ? "" : req.seller().trim();
        User seller = userRepository.findByUsernameIgnoreCase(sellerName)
                .orElseThrow(() -> new ConflictException("O vendedor ainda não ativou uma conta no Bazaar."));
        if (seller.getId().equals(userId)) {
            throw new ValidationException("Este anúncio pertence à sua conta.");
        }
        String adId = req.adId() == null ? "" : req.adId();

        Conversation conversa = conversationRepository.findByBuyerIdOrSellerId(userId, userId).stream()
                .filter(c -> adId.equals(c.getAdId()) && userId.equals(c.getBuyerId()) && seller.getId().equals(c.getSellerId()))
                .findFirst()
                .orElse(null);

        if (conversa == null) {
            conversa = new Conversation();
            conversa.setId(UUID.randomUUID().toString());
            conversa.setAdId(adId);
            conversa.setBuyerId(userId);
            conversa.setSellerId(seller.getId());
            aplicarDadosDoAnuncio(conversa, req);
            conversationRepository.save(conversa);
        } else if (!StringUtils.hasText(conversa.getImageUrl()) && StringUtils.hasText(req.image())) {
            aplicarDadosDoAnuncio(conversa, req);
            conversa.setUpdatedAt(OffsetDateTime.now());
            conversationRepository.save(conversa);
        }

        Map<String, String> nomes = usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        return view(conversa, nomes);
    }

    @Transactional
    public MessageDto sendMessage(String conversationId, String userId, String username, String texto) {
        Conversation conversa = requireParticipant(conversationId, userId);
        String limpo = texto == null ? "" : texto.trim();
        if (limpo.isEmpty()) {
            throw new ValidationException("Mensagem vazia.");
        }
        if (limpo.length() > 1000) {
            limpo = limpo.substring(0, 1000);
        }
        Message message = new Message();
        message.setId(UUID.randomUUID().toString());
        message.setConversationId(conversationId);
        message.setAuthorId(userId);
        message.setText(limpo);
        message.getReadBy().add(userId);
        messageRepository.save(message);

        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);

        return new MessageDto(message.getId(), conversationId, username, userId, limpo, message.getCreatedAt());
    }

    @Transactional
    public void markRead(String conversationId, String userId) {
        requireParticipant(conversationId, userId);
        List<Message> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        for (Message m : msgs) {
            if (m.getReadBy().add(userId)) {
                messageRepository.save(m);
            }
        }
    }

    @Transactional
    public ConversationView setStatus(String conversationId, String userId, String status) {
        Conversation conversa = requireParticipant(conversationId, userId);
        if (!STATUS.contains(status)) {
            throw new ValidationException("Estado inválido.");
        }
        conversa.setStatus(status);
        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);
        Map<String, String> nomes = usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        return view(conversa, nomes);
    }

    private Conversation requireParticipant(String conversationId, String userId) {
        Conversation conversa = conversationRepository.findById(conversationId).orElse(null);
        if (conversa == null || !conversa.hasParticipant(userId)) {
            throw new ResourceNotFoundException("Conversa não encontrada.");
        }
        return conversa;
    }

    private void aplicarDadosDoAnuncio(Conversation conversa, StartRequest req) {
        conversa.setTitle(trunc(req.title(), 120));
        conversa.setImageUrl(trunc(req.image(), 500));
        conversa.setPrice(req.price() == null ? BigDecimal.ZERO : req.price());
        conversa.setCurrency(CURRENCIES.contains(req.currency()) ? req.currency() : "diamante");
        conversa.setDetails(trunc(req.details(), 200));
    }

    private Map<String, String> usernames(Set<String> ids) {
        Set<String> validos = ids.stream().filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        return userRepository.findAllById(validos).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));
    }

    private ConversationView view(Conversation c, Map<String, String> nomes) {
        return new ConversationView(
                c.getId(), c.getAdId(), nz(c.getTitle()),
                nomes.getOrDefault(c.getBuyerId(), ""), nomes.getOrDefault(c.getSellerId(), ""),
                nz(c.getImageUrl()), c.getPrice(), c.getCurrency(), nz(c.getDetails()),
                c.getStatus(), c.getCreatedAt(), c.getUpdatedAt());
    }

    private MessageDto message(Message m, Map<String, String> nomes) {
        return new MessageDto(m.getId(), m.getConversationId(),
                nomes.getOrDefault(m.getAuthorId(), ""), m.getAuthorId(), m.getText(), m.getCreatedAt());
    }

    private static String trunc(String v, int max) {
        if (v == null) {
            return null;
        }
        String t = v.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String nz(String v) {
        return v == null ? "" : v;
    }
}
