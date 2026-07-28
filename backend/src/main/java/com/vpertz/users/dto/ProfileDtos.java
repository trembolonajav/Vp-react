package com.vpertz.users.dto;

import java.time.OffsetDateTime;

public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record ProfileResponse(
            String username,
            String avatar,
            String bio,
            String contact,
            String preferredContact,
            OffsetDateTime createdAt) {
    }

    public record ProfileUpdateRequest(
            String bio,
            String contact,
            String preferredContact,
            String avatar) {
    }
}
