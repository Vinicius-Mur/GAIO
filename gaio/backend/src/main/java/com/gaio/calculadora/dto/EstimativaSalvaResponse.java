package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Zona;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record EstimativaSalvaResponse(
        Long id,
        String bairroOuCep,
        Double areaM2,
        Integer quartos,
        Integer banheiros,
        Integer vagasGaragem,
        CategoriaImovel categoria,
        TipoImovel tipo,
        Zona zona,
        Double condominio,
        Amenidades amenidades,
        BigDecimal valorEstimado,
        BigDecimal faixaMinima,
        BigDecimal faixaMaxima,
        Double confianca,
        List<String> dicasFotos,
        List<String> insightsMercado,
        ReferenciaMercado referenciaMercado,
        Instant criadoEm
) {

    public static EstimativaSalvaResponse from(Estimativa estimativa, List<String> dicasFotos) {
        return new EstimativaSalvaResponse(
                estimativa.getId(),
                estimativa.getBairroOuCep(),
                estimativa.getAreaM2(),
                estimativa.getQuartos(),
                estimativa.getBanheiros(),
                estimativa.getVagasGaragem(),
                estimativa.getCategoria(),
                estimativa.getTipo(),
                estimativa.getZona(),
                estimativa.getCondominio(),
                Amenidades.from(estimativa.getAmenidades()),
                estimativa.getValorEstimado(),
                estimativa.getFaixaMinima(),
                estimativa.getFaixaMaxima(),
                estimativa.getConfianca(),
                dicasFotos,
                List.copyOf(estimativa.getInsightsMercado()),
                ReferenciaMercado.from(estimativa.getReferenciaMercado()),
                estimativa.getCriadoEm()
        );
    }
}
