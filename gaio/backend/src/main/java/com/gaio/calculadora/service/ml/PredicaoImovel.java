package com.gaio.calculadora.service.ml;

import java.math.BigDecimal;
import java.util.List;

public record PredicaoImovel(
        BigDecimal valorEstimado,
        BigDecimal faixaMinima,
        BigDecimal faixaMaxima,
        Double confianca,
        List<String> insightsMercado,
        com.gaio.calculadora.dto.ReferenciaMercado referenciaMercado
) {
}
