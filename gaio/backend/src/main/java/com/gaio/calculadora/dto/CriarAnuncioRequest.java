package com.gaio.calculadora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarAnuncioRequest(

        @NotNull(message = "Informe o id da estimativa")
        Long estimativaId,

        @NotBlank(message = "Informe o bairro")
        String bairro,

        @NotBlank(message = "Informe o endereço completo")
        String enderecoCompleto
) {
}
