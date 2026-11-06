package com.gaio.calculadora.service.ml;

/**
 * Ponto de integracao com o modelo de Machine Learning responsavel por estimar
 * o valor do imovel. A implementacao real (MlPredictionServiceClient) consome
 * o servico produzido pelo integrante responsavel pelos dados/modelo; enquanto
 * ele nao estiver disponivel, MlPredictionServiceMock mantem o fluxo completo
 * funcional com uma heuristica simples.
 */
public interface MlPredictionService {

    PredicaoImovel prever(ImovelFeatures features);

    /** Estatisticas dos anuncios do bairro informado; vazio quando o bairro nao e reconhecido. */
    java.util.Optional<com.gaio.calculadora.dto.MercadoBairroResponse> mercadoDoBairro(String bairro);

    /** Panorama da base de anuncios e qualidade do modelo. */
    com.gaio.calculadora.dto.MercadoResumoResponse resumoDoMercado();
}
