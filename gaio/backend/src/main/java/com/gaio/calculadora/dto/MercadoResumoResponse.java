package com.gaio.calculadora.dto;

import java.util.List;
import java.util.Map;

/** Panorama da base de anuncios usada no treino e indicadores de qualidade do modelo. */
public record MercadoResumoResponse(
        int totalAnuncios,
        int minimoAnunciosRanking,
        List<ZonaResumo> zonas,
        List<BairroPreco> bairros,
        List<PremioAmenidade> premiosAmenidades,
        List<Distribuicao> distribuicoes,
        Modelo modelo
) {

    public record ZonaResumo(String zona, int anuncios, double precoM2Mediano, Map<String, Double> precoM2PorCategoria) {
    }

    /** Bairro com amostra suficiente na categoria; anuncios e a contagem da categoria, nao do bairro inteiro. */
    public record BairroPreco(String bairro, String zona, String categoria, double precoM2, double precoM2P25,
                              double precoM2P75, int anuncios) {
    }

    /**
     * Diferenca do m2 mediano entre imoveis com e sem a amenidade, na mesma zona e categoria (associacao).
     * Zona nula = cidade toda.
     */
    public record PremioAmenidade(String zona, String categoria, String amenidade, double premio) {
    }

    /** Contagem de anuncios por tipo e por quartos (5 = 5 ou mais), por zona e categoria. */
    public record Distribuicao(String zona, String categoria, int anuncios, Map<String, Integer> tipos,
                               Map<String, Integer> quartos) {
    }

    public record Modelo(List<Cenario> cenarios, List<Importancia> importancias) {
    }

    public record Cenario(String cenario, double erroMediano, double mape, double cobertura, double meiaLargura) {
    }

    public record Importancia(String variavel, double peso) {
    }
}
