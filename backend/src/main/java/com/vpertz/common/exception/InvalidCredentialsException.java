package com.vpertz.common.exception;

/** Login ou senha incorretos (resulta em 401). */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
