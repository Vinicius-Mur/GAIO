package com.gaio.calculadora.exception;

public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("Email ou senha inválidos");
    }
}
