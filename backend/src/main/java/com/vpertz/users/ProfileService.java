package com.vpertz.users;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.users.dto.ProfileDtos.ProfileResponse;
import com.vpertz.users.dto.ProfileDtos.ProfileUpdateRequest;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final Set<String> CONTATOS = Set.of("Chat do Bazaar", "Discord", "WhatsApp");

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getPublic(String username) {
        return userRepository.findByUsernameIgnoreCase(username)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado."));
    }

    @Transactional
    public ProfileResponse updateMe(String userId, ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        user.setBio(emptyToNull(clean(req.bio(), 240)));
        user.setContact(emptyToNull(clean(req.contact(), 80)));
        user.setPreferredContact(CONTATOS.contains(req.preferredContact()) ? req.preferredContact() : "Chat do Bazaar");
        String avatar = clean(req.avatar(), 40);
        user.setAvatar(avatar.isEmpty() ? "initial" : avatar);
        userRepository.save(user);
        return toResponse(user);
    }

    private ProfileResponse toResponse(User user) {
        return new ProfileResponse(
                user.getUsername(),
                user.getAvatar() == null ? "initial" : user.getAvatar(),
                nz(user.getBio()),
                nz(user.getContact()),
                user.getPreferredContact(),
                user.getCreatedAt());
    }

    private static String clean(String value, int max) {
        if (value == null) {
            return "";
        }
        String t = value
                .replaceAll("<[^>]*>", "")
                .replace("<", "")
                .replace(">", "")
                .trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String emptyToNull(String value) {
        return value.isEmpty() ? null : value;
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }
}
