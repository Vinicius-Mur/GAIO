package com.gaio.calculadora.exception;

public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException(String email) {
        super("Já existe uma conta cadastrada com o email: " + email);
    }
}
