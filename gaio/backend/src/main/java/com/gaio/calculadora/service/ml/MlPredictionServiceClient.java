package com.gaio.calculadora.service.ml;

import com.gaio.calculadora.exception.ExternalServiceException;
import com.gaio.calculadora.dto.MercadoBairroResponse;
import com.gaio.calculadora.dto.MercadoResumoResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@ConditionalOnProperty(prefix = "app.ml-service", name = "mock", havingValue = "false")
public class MlPredictionServiceClient implements MlPredictionService {

    private final WebClient mlServiceWebClient;

    public MlPredictionServiceClient(WebClient mlServiceWebClient) {
        this.mlServiceWebClient = mlServiceWebClient;
    }

    @Override
    public PredicaoImovel prever(ImovelFeatures features) {
        try {
            return mlServiceWebClient.post()
                    .uri("/predict")
                    .bodyValue(features)
                    .retrieve()
                    .bodyToMono(PredicaoImovel.class)
                    .block();
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao consultar o serviço de estimativa (ML)", e);
        }
    }

    @Override
    public MercadoResumoResponse resumoDoMercado() {
        try {
            return mlServiceWebClient.get()
                    .uri("/mercado/resumo")
                    .retrieve()
                    .bodyToMono(MercadoResumoResponse.class)
                    .block();
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao consultar o resumo do mercado (ML)", e);
        }
    }

    @Override
    public Optional<MercadoBairroResponse> mercadoDoBairro(String bairro) {
        try {
            return Optional.ofNullable(mlServiceWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/mercado/bairro").queryParam("nome", bairro).build())
                    .retrieve()
                    .bodyToMono(MercadoBairroResponse.class)
                    .block());
        } catch (WebClientResponseException.NotFound e) {
            return Optional.empty();
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao consultar os dados de mercado (ML)", e);
        }
    }
}
