package com.vpertz.listings.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/** Envelope de paginação previsível para as listagens. */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    /** page volta como 1-based para casar com o frontend. */
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
