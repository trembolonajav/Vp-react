package com.vpertz.auth;

import com.vpertz.auth.dto.AuthResponse;
import com.vpertz.auth.dto.LoginRequest;
import com.vpertz.auth.dto.RegisterRequest;
import com.vpertz.auth.dto.UserDto;
import com.vpertz.common.exception.ConflictException;
import com.vpertz.common.exception.InvalidCredentialsException;
import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.security.JwtService;
import com.vpertz.common.security.PasswordService;
import com.vpertz.users.Role;
import com.vpertz.users.User;
import com.vpertz.users.UserRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Regras de autenticação: login (com migração transparente scrypt→bcrypt), registro e perfil. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordService passwordService, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String key = request.login().trim().toLowerCase();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(key, key)
                .orElseThrow(() -> new InvalidCredentialsException("Login ou senha incorretos."));

        if (!passwordService.matches(user, request.password())) {
            throw new InvalidCredentialsException("Login ou senha incorretos.");
        }

        // Migração transparente: hash legado vira bcrypt no primeiro login válido.
        if (passwordService.isLegacy(user)) {
            user.setPasswordHash(passwordService.encode(request.password()));
            user.setPasswordAlgo(PasswordService.ALGO_BCRYPT);
            user.setPasswordSalt(null);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
        }

        return new AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Usuário já cadastrado.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("E-mail já cadastrado.");
        }

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordService.encode(request.password()));
        user.setPasswordAlgo(PasswordService.ALGO_BCRYPT);
        user.setRole(Role.USER);
        userRepository.save(user);

        return new AuthResponse(jwtService.generate(user), toDto(user));
    }

    @Transactional(readOnly = true)
    public UserDto me(String userId) {
        return userRepository.findById(userId)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getAvatar() == null ? "" : user.getAvatar());
    }
}
