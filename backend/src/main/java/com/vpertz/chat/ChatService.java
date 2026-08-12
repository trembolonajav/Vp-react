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
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.users.User;
import com.vpertz.users.UserRepository;
import com.vpertz.integrations.WhatsAppBridge;
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

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final WhatsAppBridge whatsAppBridge;
    private final String publicBaseUrl;

    ChatService(ConversationRepository conversationRepository,
               MessageRepository messageRepository,
               UserRepository userRepository,
               ListingRepository listingRepository,
               WhatsAppBridge whatsAppBridge,
               @org.springframework.beans.factory.annotation.Value("${app.public-base-url:http://localhost:8190}") String publicBaseUrl) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.whatsAppBridge = whatsAppBridge;
        this.publicBaseUrl = (publicBaseUrl == null ? "http://localhost:8190" : publicBaseUrl).replaceAll("/+$", "");
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
    public ConversationsList listForAdmin(String status) {
        List<Conversation> conversas = "todas".equals(status)
                ? conversationRepository.findAll()
                : conversationRepository.findByStatusOrderByUpdatedAtDesc(status);
        Map<String, String> nomes = usernames(conversas.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getBuyerId(), c.getSellerId()))
                .collect(Collectors.toSet()));
        List<ConversationSummary> resumos = conversas.stream()
                .map(c -> {
                    List<Message> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
                    Message ultima = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
                    return new ConversationSummary(view(c, nomes), ultima == null ? null : message(ultima, nomes), 0);
                })
                .sorted(Comparator.comparing((ConversationSummary s) -> s.conversation().updatedAt()).reversed())
                .toList();
        return new ConversationsList(resumos, 0);
    }

    @Transactional(readOnly = true)
    public ConversationDetail getDetailForAdmin(String conversationId) {
        Conversation conversa = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));
        List<Message> mensagens = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        Set<String> ids = new HashSet<>(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        mensagens.stream().map(Message::getAuthorId).filter(java.util.Objects::nonNull).forEach(ids::add);
        Map<String, String> nomes = usernames(ids);
        return new ConversationDetail(view(conversa, nomes), mensagens.stream().map(m -> message(m, nomes)).toList());
    }

    @Transactional(readOnly = true)
    public ConversationDetail getDetail(String conversationId, String userId) {
        Conversation conversa = requireParticipant(conversationId, userId);
        List<Message> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        // inclui autores das mensagens (ex.: moderador do intermédio) além de comprador/vendedor
        Set<String> ids = new HashSet<>(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        msgs.stream().map(Message::getAuthorId).filter(java.util.Objects::nonNull).forEach(ids::add);
        Map<String, String> nomes = usernames(ids);
        List<MessageDto> mensagens = msgs.stream().map(m -> message(m, nomes)).toList();
        return new ConversationDetail(view(conversa, nomes), mensagens);
    }

    @Transactional
    public ConversationView start(String userId, StartRequest req) {
        String adId = req.adId() == null ? "" : req.adId().trim();
        Listing listing = listingRepository.findByPublicId(adId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado."));
        if (!"ativo".equals(listing.getStatus())) {
            throw new ConflictException("Este anúncio não está disponível para negociação.");
        }
        User seller = listing.getSellerId() == null
                ? userRepository.findByUsernameIgnoreCase(listing.getVendedor())
                    .orElseThrow(() -> new ConflictException("O vendedor ainda não ativou uma conta no Bazaar."))
                : userRepository.findById(listing.getSellerId())
                    .orElseThrow(() -> new ConflictException("O vendedor ainda não ativou uma conta no Bazaar."));
        if (seller.getId().equals(userId)) {
            throw new ValidationException("Este anúncio pertence à sua conta.");
        }
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
            aplicarDadosDoAnuncio(conversa, listing);
            conversationRepository.save(conversa);
        } else if (!StringUtils.hasText(conversa.getImageUrl()) && StringUtils.hasText(listing.getImgUrl())) {
            aplicarDadosDoAnuncio(conversa, listing);
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

    /** Envio pelo painel de admin (moderador do intermédio): não exige ser participante. */
    @Transactional
    public MessageDto adminSendMessage(String conversationId, String adminId, String adminUsername, String texto) {
        Conversation conversa = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));
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
        message.setAuthorId(adminId);
        message.setText(limpo);
        message.getReadBy().add(adminId);
        messageRepository.save(message);

        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);

        return new MessageDto(message.getId(), conversationId, adminUsername, adminId, limpo, message.getCreatedAt());
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
        String statusAnterior = conversa.getStatus();
        conversa.setStatus(status);
        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);
        Map<String, String> nomes = usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        ConversationView result = view(conversa, nomes);
        if (whatsAppBridge != null && "intermedio-solicitado".equals(status) && !status.equals(statusAnterior)) {
            whatsAppBridge.alertIntermediary(conversa.getId(), nz(conversa.getTitle()),
                    nomes.getOrDefault(conversa.getBuyerId(), ""), nomes.getOrDefault(conversa.getSellerId(), ""),
                    publicBaseUrl + "/admin#intermedios");
        }
        return result;
    }

    private Conversation requireParticipant(String conversationId, String userId) {
        Conversation conversa = conversationRepository.findById(conversationId).orElse(null);
        if (conversa == null || !conversa.hasParticipant(userId)) {
            throw new ResourceNotFoundException("Conversa não encontrada.");
        }
        return conversa;
    }

    private void aplicarDadosDoAnuncio(Conversation conversa, Listing listing) {
        conversa.setTitle(trunc(listing.getTitulo(), 120));
        conversa.setImageUrl(trunc(listing.getImgUrl(), 500));
        conversa.setPrice(listing.getPreco() == null ? BigDecimal.ZERO : listing.getPreco());
        conversa.setCurrency("diamonds".equals(listing.getMoeda()) ? "diamante" : "pix");
        conversa.setDetails(trunc(listing.getDescricao(), 200));
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
