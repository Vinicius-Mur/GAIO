package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Zona;

import java.math.BigDecimal;
import java.util.List;

public record EstimativaResponse(
        BigDecimal valorEstimado,
        BigDecimal faixaMinima,
        BigDecimal faixaMaxima,
        Double confianca,
        ParametrosUtilizados parametros,
        List<String> insightsMercado,
        List<String> dicasFotos,
        ReferenciaMercado referenciaMercado
) {

    public record ParametrosUtilizados(
            String localizacao,
            Double areaM2,
            Integer quartos,
            Integer banheiros,
            Integer vagasGaragem,
            CategoriaImovel categoria,
            TipoImovel tipo,
            Zona zona,
            Double condominio,
            Amenidades amenidades
    ) {
    }
}
