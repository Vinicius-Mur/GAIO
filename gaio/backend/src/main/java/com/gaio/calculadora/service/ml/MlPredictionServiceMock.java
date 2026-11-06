package com.gaio.calculadora.service.ml;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@ConditionalOnProperty(prefix = "app.ml-service", name = "mock", havingValue = "true", matchIfMissing = true)
public class MlPredictionServiceMock implements MlPredictionService {

    private static final BigDecimal VALOR_BASE_POR_M2 = BigDecimal.valueOf(9500);
    private static final BigDecimal ACRESCIMO_POR_QUARTO = BigDecimal.valueOf(15000);
    private static final BigDecimal ACRESCIMO_POR_BANHEIRO = BigDecimal.valueOf(8000);
    private static final BigDecimal ACRESCIMO_POR_VAGA = BigDecimal.valueOf(20000);
    private static final BigDecimal ACRESCIMO_POR_AMENIDADE = BigDecimal.valueOf(4000);

    @Override
    public PredicaoImovel prever(ImovelFeatures features) {
        BigDecimal area = BigDecimal.valueOf(features.areaM2());

        BigDecimal valorEstimado = area.multiply(VALOR_BASE_POR_M2)
                .add(ACRESCIMO_POR_QUARTO.multiply(BigDecimal.valueOf(features.quartos())))
                .add(ACRESCIMO_POR_BANHEIRO.multiply(BigDecimal.valueOf(features.banheiros())))
                .add(ACRESCIMO_POR_VAGA.multiply(BigDecimal.valueOf(features.vagasGaragem())))
                .add(ACRESCIMO_POR_AMENIDADE.multiply(BigDecimal.valueOf(contarAmenidades(features))))
                .multiply(fatorZona(features.zona()))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal margem = valorEstimado.multiply(BigDecimal.valueOf(0.07));
        BigDecimal faixaMinima = valorEstimado.subtract(margem).setScale(2, RoundingMode.HALF_UP);
        BigDecimal faixaMaxima = valorEstimado.add(margem).setScale(2, RoundingMode.HALF_UP);

        List<String> insights = List.of(
                "Estimativa gerada em modo mock - conecte o serviço de ML real em app.ml-service.mock=false.",
                "Região informada: " + features.bairroOuCep() + " (zona " + features.zona() + ")."
        );

        return new PredicaoImovel(valorEstimado, faixaMinima, faixaMaxima, 0.70, insights, null);
    }

    @Override
    public java.util.Optional<com.gaio.calculadora.dto.MercadoBairroResponse> mercadoDoBairro(String bairro) {
        throw new com.gaio.calculadora.exception.ExternalServiceException(
                "Os dados de mercado vêm do serviço de ML: rode o backend com ML_SERVICE_MOCK=false.", null);
    }

    @Override
    public com.gaio.calculadora.dto.MercadoResumoResponse resumoDoMercado() {
        throw new com.gaio.calculadora.exception.ExternalServiceException(
                "Os dados de mercado vêm do serviço de ML: rode o backend com ML_SERVICE_MOCK=false.", null);
    }

    private long contarAmenidades(ImovelFeatures features) {
        boolean[] amenidades = {
                features.academia(), features.elevador(), features.permitidoAnimais(), features.piscina(),
                features.portaria(), features.salaoFestas(), features.condominioFechado(), features.seguranca24h(),
                features.portaoEletronico(), features.areaMurada(), features.areaServico(), features.armariosCozinha(),
                features.armariosQuarto(), features.churrasqueira(), features.mobiliado(), features.quartoServico(),
                features.arCondicionado(), features.porteiro24h(), features.varanda()
        };
        long total = 0;
        for (boolean amenidade : amenidades) {
            if (amenidade) {
                total++;
            }
        }
        return total;
    }

    private BigDecimal fatorZona(String zona) {
        if (zona == null) {
            return BigDecimal.ONE;
        }
        return switch (zona) {
            case "OESTE", "CENTRO" -> BigDecimal.valueOf(1.10);
            case "SUL" -> BigDecimal.valueOf(1.02);
            case "NORTE", "LESTE" -> BigDecimal.valueOf(0.95);
            default -> BigDecimal.ONE;
        };
    }
}
