package com.gaio.calculadora.dto;

import java.util.List;
import java.util.Map;

/**
 * Estatisticas dos anuncios da base de treino para um bairro (ou para a zona, quando o bairro
 * tem poucos anuncios). Calculadas pelo servico de ML.
 */
public record MercadoBairroResponse(
        String bairro,
        String zona,
        String fonte,
        int anuncios,
        Double precoM2Mediano,
        Map<String, Double> precoM2PorCategoria,
        Map<String, List<Double>> precoM2QuartisPorCategoria,
        Map<String, Integer> anunciosPorCategoria,
        Map<String, Integer> quartos,
        Map<String, Integer> tipos,
        Double condominioMedianoApartamentos
) {
}
