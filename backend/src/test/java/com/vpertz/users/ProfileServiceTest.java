package com.vpertz.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vpertz.users.dto.ProfileDtos.ProfileResponse;
import com.vpertz.users.dto.ProfileDtos.ProfileUpdateRequest;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private UserRepository repository;
    @InjectMocks private ProfileService service;

    @Test
    void perfilPublicoPodeSerConsultadoSemDiferenciarMaiusculas() {
        User user = user();
        when(repository.findByUsernameIgnoreCase("MOONLIGHT")).thenReturn(Optional.of(user));

        ProfileResponse result = service.getPublic("MOONLIGHT");

        assertThat(result.username()).isEqualTo("moonlight");
        assertThat(result.bio()).isEqualTo("Treinadora");
        assertThat(result.createdAt()).isEqualTo(user.getCreatedAt());
    }

    @Test
    void meuPerfilUsaSomenteAIdentidadeAutenticada() {
        User user = user();
        when(repository.findById("user-1")).thenReturn(Optional.of(user));

        ProfileResponse result = service.getMe("user-1");

        assertThat(result.username()).isEqualTo("moonlight");
        verify(repository).findById("user-1");
    }

    @Test
    void atualizacaoLimpaCamposELimitaContatoPreferido() {
        User user = user();
        when(repository.findById("user-1")).thenReturn(Optional.of(user));
        when(repository.save(user)).thenReturn(user);

        ProfileResponse result = service.updateMe("user-1", new ProfileUpdateRequest(
                "  <b>Nova bio</b>  ",
                "  @discord  ",
                "Telegram",
                ""));

        assertThat(result.bio()).isEqualTo("Nova bio");
        assertThat(result.contact()).isEqualTo("@discord");
        assertThat(result.preferredContact()).isEqualTo("Chat do Bazaar");
        assertThat(result.avatar()).isEqualTo("initial");
        verify(repository).save(user);
    }

    private static User user() {
        User user = new User();
        user.setId("user-1");
        user.setUsername("moonlight");
        user.setEmail("moonlight@example.test");
        user.setBio("Treinadora");
        user.setPreferredContact("Discord");
        user.setCreatedAt(OffsetDateTime.parse("2026-07-01T12:00:00Z"));
        return user;
    }
}
