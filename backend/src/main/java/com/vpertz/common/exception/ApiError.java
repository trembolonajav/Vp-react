package com.vpertz.common.exception;

import java.time.OffsetDateTime;

/** Corpo padronizado de erro devolvido pela API. */
public record ApiError(
        int status,
        String error,
        String message,
        OffsetDateTime timestamp,
        String path) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, OffsetDateTime.now(), path);
    }
}
