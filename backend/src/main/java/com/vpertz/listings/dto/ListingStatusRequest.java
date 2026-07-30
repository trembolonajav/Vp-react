package com.vpertz.listings.dto;

import jakarta.validation.constraints.NotBlank;

/** Alteração isolada do ciclo de vida de um anúncio. */
public record ListingStatusRequest(
        @NotBlank(message = "Status obrigatório.") String status) {
}
