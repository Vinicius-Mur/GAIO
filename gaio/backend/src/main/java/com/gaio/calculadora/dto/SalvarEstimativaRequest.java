package com.gaio.calculadora.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record SalvarEstimativaRequest(

        @Valid
        @NotNull
        EstimativaRequest parametros,

        @NotNull
        BigDecimal valorEstimado,

        BigDecimal faixaMinima,

        BigDecimal faixaMaxima,

        Double confianca,

        @Size(max = 10, message = "No máximo 10 insights por estimativa")
        List<@Size(max = 1000, message = "Insight muito longo") String> insightsMercado,

        @Valid
        ReferenciaMercado referenciaMercado
) {
}
