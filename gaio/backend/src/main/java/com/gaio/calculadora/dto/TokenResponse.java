package com.gaio.calculadora.dto;

public record TokenResponse(
        String token,
        String tipo,
        long expiraEmMs,
        UsuarioResponse usuario
) {
    public static TokenResponse of(String token, long expiraEmMs, UsuarioResponse usuario) {
        return new TokenResponse(token, "Bearer", expiraEmMs, usuario);
    }
}
