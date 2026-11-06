package com.gaio.calculadora.exception;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        List<String> mensagens
) {

    public static ApiErrorResponse of(int status, String error, List<String> mensagens) {
        return new ApiErrorResponse(Instant.now(), status, error, mensagens);
    }
}
