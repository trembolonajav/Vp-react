package com.vpertz.chat;

import com.vpertz.chat.dto.ChatDtos.ConversationDetail;
import com.vpertz.chat.dto.ChatDtos.ConversationSummary;
import com.vpertz.chat.dto.ChatDtos.ConversationView;
import com.vpertz.chat.dto.ChatDtos.ConversationsList;
import com.vpertz.chat.dto.ChatDtos.MessageDto;
import com.vpertz.chat.dto.ChatDtos.NegotiationEventDto;
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

    private static final Set<String> STATUS = Set.of("aberta", "intermedio-solicitado", "intermedio-assumido",
            "produto-recebido", "pagamento-recebido", "entregas-confirmadas", "concluida", "encerrada");
    private static final Map<String, String> SYSTEM_MESSAGES = Map.of(
            "intermedio-solicitado", "⛨ Intermédio da VP solicitado. Aguardando um moderador assumir.",
            "intermedio-assumido", "🛡️ Um moderador da VP assumiu o intermédio. Vendedor e comprador devem seguir as orientações deste chat.",
            "produto-recebido", "📦 O intermediador confirmou o recebimento do produto enviado pelo vendedor.",
            "pagamento-recebido", "💰 O intermediador confirmou o recebimento do pagamento enviado pelo comprador. Produto e pagamento estão sob custódia da VP.",
            "entregas-confirmadas", "✅ O intermediador confirmou a entrega do produto ao comprador e do pagamento ao vendedor.",
            "produto-confirmado-comprador", "✅ O comprador confirmou que recebeu o produto.",
            "pagamento-confirmado-vendedor", "✅ O vendedor confirmou que recebeu o pagamento.",
            "concluida", "🏁 Negociação concluída com sucesso. O chat foi fechado e permanece disponível somente para consulta.",
            "encerrada", "✕ Negociação encerrada sem conclusão. O chat foi fechado e permanece disponível somente para consulta.");

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NegotiationEventRepository eventRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final WhatsAppBridge whatsAppBridge;
    private final String publicBaseUrl;

    ChatService(ConversationRepository conversationRepository,
               MessageRepository messageRepository,
               NegotiationEventRepository eventRepository,
               UserRepository userRepository,
               ListingRepository listingRepository,
               WhatsAppBridge whatsAppBridge,
               @org.springframework.beans.factory.annotation.Value("${app.public-base-url:http://localhost:8190}") String publicBaseUrl) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.eventRepository = eventRepository;
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
        return new ConversationDetail(view(conversa, nomes), mensagens.stream().map(m -> message(m, nomes)).toList(), events(conversationId));
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
        return new ConversationDetail(view(conversa, nomes), mensagens, events(conversationId));
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
            recordEvent(conversa.getId(), "NEGOTIATION_STARTED", userId, nomesDoUsuario(userId), "Negociação iniciada");
            saveSystemMessage(conversa.getId(), userId, "💬 Uma nova negociação foi aberta para este anúncio.");
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
        if (isTerminal(conversa.getStatus())) throw new ConflictException("Esta negociação já foi finalizada.");
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
        if (isTerminal(conversa.getStatus())) throw new ConflictException("Esta negociação já foi finalizada.");
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
        if (!Set.of("intermedio-solicitado", "confirmar-produto", "confirmar-pagamento", "encerrada").contains(status)) throw new ValidationException("Ação não permitida para participante.");
        if (isTerminal(conversa.getStatus())) throw new ConflictException("Esta negociação já foi finalizada.");
        if ("intermedio-solicitado".equals(status) && (!"aberta".equals(conversa.getStatus()) || conversa.isBuyerProductConfirmed() || conversa.isSellerPaymentConfirmed())) throw new ConflictException("O intermédio deve ser solicitado antes das confirmações da negociação direta.");
        boolean confirmacaoIntermediadaLiberada = conversa.isIntermediaryUsed() && conversa.isVpItemDelivered() && conversa.isVpPaymentDelivered();
        if (Set.of("confirmar-produto", "confirmar-pagamento").contains(status) && !"aberta".equals(conversa.getStatus()) && !confirmacaoIntermediadaLiberada) throw new ConflictException("As confirmações finais ainda não foram liberadas.");
        if ("confirmar-produto".equals(status)) {
            if (!userId.equals(conversa.getBuyerId())) throw new ValidationException("Somente o comprador confirma o recebimento do produto.");
            if (conversa.isBuyerProductConfirmed()) throw new ConflictException("O produto já foi confirmado.");
            conversa.setBuyerProductConfirmed(true);
            if ("UNDEFINED".equals(conversa.getNegotiationMode())) conversa.setNegotiationMode("DIRECT");
            recordEvent(conversa.getId(), conversa.isIntermediaryUsed() ? "BUYER_ITEM_CONFIRMED" : "DIRECT_BUYER_ITEM_CONFIRMED", userId, nomesDoUsuario(userId), "Produto recebido pelo comprador");
            saveSystemMessage(conversa.getId(), userId, SYSTEM_MESSAGES.get("produto-confirmado-comprador"));
            return finishDirectIfReady(conversa, userId);
        }
        if ("confirmar-pagamento".equals(status)) {
            if (!userId.equals(conversa.getSellerId())) throw new ValidationException("Somente o vendedor confirma o recebimento do pagamento.");
            if (conversa.isSellerPaymentConfirmed()) throw new ConflictException("O pagamento já foi confirmado.");
            conversa.setSellerPaymentConfirmed(true);
            if ("UNDEFINED".equals(conversa.getNegotiationMode())) conversa.setNegotiationMode("DIRECT");
            recordEvent(conversa.getId(), conversa.isIntermediaryUsed() ? "SELLER_PAYMENT_CONFIRMED" : "DIRECT_SELLER_PAYMENT_CONFIRMED", userId, nomesDoUsuario(userId), "Pagamento recebido pelo vendedor");
            saveSystemMessage(conversa.getId(), userId, SYSTEM_MESSAGES.get("pagamento-confirmado-vendedor"));
            return finishDirectIfReady(conversa, userId);
        }
        if ("encerrada".equals(status) && !Set.of("aberta", "intermedio-solicitado").contains(conversa.getStatus())) throw new ConflictException("Um intermédio assumido deve ser finalizado pelo moderador.");
        return transition(conversa, status, userId, nomesDoUsuario(userId));
    }

    @Transactional
    public ConversationView adminSetStatus(String conversationId, String adminId, String adminUsername, String status) {
        Conversation conversa = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada."));
        if (isTerminal(conversa.getStatus())) throw new ConflictException("Esta negociação já foi finalizada.");
        if ("intermedio-assumido".equals(status) && "intermedio-solicitado".equals(conversa.getStatus())) return transition(conversa, status, adminId, adminUsername);
        if ("vp-produto-recebido".equals(status) && "intermedio-assumido".equals(conversa.getStatus()) && !conversa.isVpItemReceived()) {
            conversa.setVpItemReceived(true); recordAdminEvent(conversa, "VP_ITEM_RECEIVED", adminId, adminUsername, "📦 A VP confirmou o recebimento do produto enviado pelo vendedor."); return saveAdminProgress(conversa);
        }
        if ("vp-pagamento-recebido".equals(status) && "intermedio-assumido".equals(conversa.getStatus()) && !conversa.isVpPaymentReceived()) {
            conversa.setVpPaymentReceived(true); recordAdminEvent(conversa, "VP_PAYMENT_RECEIVED", adminId, adminUsername, "💰 A VP confirmou o recebimento do pagamento enviado pelo comprador."); return saveAdminProgress(conversa);
        }
        if ("vp-produto-entregue".equals(status) && conversa.isVpItemReceived() && conversa.isVpPaymentReceived() && !conversa.isVpItemDelivered()) {
            conversa.setVpItemDelivered(true); recordAdminEvent(conversa, "VP_ITEM_DELIVERED", adminId, adminUsername, "📤 A VP confirmou a entrega do produto ao comprador."); return saveAdminProgress(conversa);
        }
        if ("vp-pagamento-entregue".equals(status) && conversa.isVpItemReceived() && conversa.isVpPaymentReceived() && !conversa.isVpPaymentDelivered()) {
            conversa.setVpPaymentDelivered(true); recordAdminEvent(conversa, "VP_PAYMENT_DELIVERED", adminId, adminUsername, "📤 A VP confirmou a entrega do pagamento ao vendedor.");
            saveSystemMessage(conversa.getId(), adminId, "✅ As entregas do intermédio foram realizadas. Comprador: confirme o produto. Vendedor: confirme o pagamento.");
            recordEvent(conversa.getId(), "AWAITING_PARTY_CONFIRMATIONS", adminId, adminUsername, "Aguardando confirmações finais do comprador e do vendedor");
            return saveAdminProgress(conversa);
        }
        if ("encerrada".equals(status)) return transition(conversa, status, adminId, adminUsername);
        throw new ConflictException("Esta etapa não pode ser aplicada agora.");
    }

    private ConversationView transition(Conversation conversa, String status, String actorId, String actorName) {
        String statusAnterior = conversa.getStatus();
        conversa.setStatus(status);
        if ("intermedio-solicitado".equals(status)) { conversa.setIntermediaryUsed(true); conversa.setNegotiationMode("INTERMEDIATED"); }
        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);
        String systemText = SYSTEM_MESSAGES.get(status);
        if (systemText != null) saveSystemMessage(conversa.getId(), actorId, systemText);
        String eventType = switch (status) { case "intermedio-solicitado" -> "INTERMEDIARY_REQUESTED"; case "intermedio-assumido" -> "INTERMEDIARY_ASSIGNED"; case "concluida" -> "NEGOTIATION_COMPLETED"; case "encerrada" -> "NEGOTIATION_CANCELLED"; default -> null; };
        if (eventType != null) recordEvent(conversa.getId(), eventType, actorId, actorName, systemText);
        if ("concluida".equals(status)) listingRepository.findByPublicId(conversa.getAdId()).ifPresent(listing -> {
            listing.setStatus("vendido");
            listingRepository.save(listing);
        });
        Map<String, String> nomes = usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId()));
        ConversationView result = view(conversa, nomes);
        if (whatsAppBridge != null && "intermedio-solicitado".equals(status) && !status.equals(statusAnterior)) {
            whatsAppBridge.alertIntermediary(conversa.getId(), nz(conversa.getTitle()),
                    nomes.getOrDefault(conversa.getBuyerId(), ""), nomes.getOrDefault(conversa.getSellerId(), ""),
                    publicBaseUrl + "/admin#intermedios");
        }
        return result;
    }

    private ConversationView saveAdminProgress(Conversation conversa) {
        conversa.setUpdatedAt(OffsetDateTime.now()); conversationRepository.save(conversa);
        return view(conversa, usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId())));
    }

    private void recordAdminEvent(Conversation conversa, String type, String adminId, String adminUsername, String message) {
        recordEvent(conversa.getId(), type, adminId, adminUsername, message);
        saveSystemMessage(conversa.getId(), adminId, message);
    }

    private ConversationView finishDirectIfReady(Conversation conversa, String actorId) {
        conversa.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conversa);
        if (conversa.isBuyerProductConfirmed() && conversa.isSellerPaymentConfirmed()) return transition(conversa, "concluida", actorId, nomesDoUsuario(actorId));
        return view(conversa, usernames(Set.of(conversa.getBuyerId(), conversa.getSellerId())));
    }

    private boolean allowedAdminTransition(String current, String next) {
        return switch (current) {
            case "intermedio-solicitado" -> Set.of("intermedio-assumido", "encerrada").contains(next);
            case "intermedio-assumido" -> Set.of("produto-recebido", "encerrada").contains(next);
            case "produto-recebido" -> Set.of("pagamento-recebido", "encerrada").contains(next);
            case "pagamento-recebido" -> Set.of("entregas-confirmadas", "encerrada").contains(next);
            case "entregas-confirmadas" -> Set.of("concluida", "encerrada").contains(next);
            default -> false;
        };
    }

    private void saveSystemMessage(String conversationId, String authorId, String text) {
        Message message = new Message();
        message.setId(UUID.randomUUID().toString()); message.setConversationId(conversationId);
        message.setAuthorId(authorId); message.setText(text);
        if (authorId != null) message.getReadBy().add(authorId);
        messageRepository.save(message);
    }

    private void recordEvent(String conversationId, String type, String actorId, String actorName, String details) {
        NegotiationEvent event = new NegotiationEvent();
        event.setId(UUID.randomUUID().toString()); event.setConversationId(conversationId); event.setType(type);
        event.setActorId(actorId); event.setActorName(actorName == null || actorName.isBlank() ? "Sistema" : actorName);
        event.setDetails(details); eventRepository.save(event);
    }

    private List<NegotiationEventDto> events(String conversationId) {
        return eventRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(e -> new NegotiationEventDto(e.getId(), e.getType(), e.getActorName(), e.getDetails(), e.getCreatedAt())).toList();
    }

    private String nomesDoUsuario(String id) { return userRepository.findById(id).map(User::getUsername).orElse("Sistema"); }

    private static boolean isTerminal(String status) { return "concluida".equals(status) || "encerrada".equals(status); }

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
                c.getStatus(), c.isIntermediaryUsed(), c.isBuyerProductConfirmed(), c.isSellerPaymentConfirmed(),
                c.getNegotiationMode(), c.isVpItemReceived(), c.isVpPaymentReceived(), c.isVpItemDelivered(), c.isVpPaymentDelivered(),
                c.getCreatedAt(), c.getUpdatedAt());
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
