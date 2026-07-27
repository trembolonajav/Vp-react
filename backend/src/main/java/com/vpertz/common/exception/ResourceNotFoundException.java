package com.vpertz.common.exception;

/** Lançada quando um recurso solicitado não existe (resulta em 404). */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
