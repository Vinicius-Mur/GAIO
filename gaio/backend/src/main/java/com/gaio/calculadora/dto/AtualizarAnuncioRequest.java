package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.AnuncioStatus;

public record AtualizarAnuncioRequest(
        String titulo,
        String descricao,
        AnuncioStatus status,
        Boolean publicado
) {
}
