package com.vpertz.common.exception;

/** Conflito com o estado atual, ex.: usuário/e-mail já cadastrado (resulta em 409). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
