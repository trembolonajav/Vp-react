package com.vpertz.chat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.vpertz.chat.dto.ChatDtos.StartRequest;
import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.listings.Listing;
import com.vpertz.listings.ListingRepository;
import com.vpertz.users.User;
import com.vpertz.users.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private ListingRepository listingRepository;

    @InjectMocks private ChatService chatService;

    @Test
    void naoParticipanteNaoVeConversa() {
        Conversation conversa = new Conversation();
        conversa.setId("c1");
        conversa.setBuyerId("a");
        conversa.setSellerId("b");
        when(conversationRepository.findById("c1")).thenReturn(Optional.of(conversa));

        assertThatThrownBy(() -> chatService.getDetail("c1", "intruso"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void mensagemVaziaEhRejeitada() {
        Conversation conversa = new Conversation();
        conversa.setId("c1");
        conversa.setBuyerId("eu");
        conversa.setSellerId("b");
        when(conversationRepository.findById("c1")).thenReturn(Optional.of(conversa));

        assertThatThrownBy(() -> chatService.sendMessage("c1", "eu", "eu", "   "))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void iniciarComVendedorInexistenteConflita() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(Optional.of(listing(null, "fulano")));
        when(userRepository.findByUsernameIgnoreCase("fulano")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.start("eu", req("fulano")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void naoIniciaConversaConsigoMesmo() {
        User eu = new User();
        eu.setId("eu");
        eu.setUsername("eu");
        Listing listing = listing("eu", "eu");
        when(listingRepository.findByPublicId("an-1")).thenReturn(Optional.of(listing));
        when(userRepository.findById("eu")).thenReturn(Optional.of(eu));

        assertThatThrownBy(() -> chatService.start("eu", req("eu")))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void anuncioInexistenteNaoIniciaConversa() {
        when(listingRepository.findByPublicId("an-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.start("eu", req("inventado")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void anuncioPausadoNaoIniciaConversa() {
        Listing listing = listing("seller-id", "fulano");
        listing.setStatus("pausado");
        when(listingRepository.findByPublicId("an-1")).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> chatService.start("eu", req("fulano")))
                .isInstanceOf(ConflictException.class);
    }

    private static Listing listing(String sellerId, String vendedor) {
        Listing listing = new Listing();
        listing.setPublicId("an-1");
        listing.setSellerId(sellerId);
        listing.setVendedor(vendedor);
        listing.setTitulo("Título real");
        listing.setStatus("ativo");
        return listing;
    }

    private static StartRequest req(String seller) {
        return new StartRequest("an-1", seller, "Título", null, null, "diamante", null);
    }
}
