package com.vpertz.common.exception;

/** Dado semanticamente inválido que passou pela desserialização (resulta em 422). */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
