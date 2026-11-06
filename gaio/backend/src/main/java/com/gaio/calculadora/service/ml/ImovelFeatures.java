package com.gaio.calculadora.service.ml;

import com.gaio.calculadora.dto.EstimativaRequest;

public record ImovelFeatures(
        String bairroOuCep,
        Double areaM2,
        Integer quartos,
        Integer banheiros,
        Integer vagasGaragem,
        String categoria,
        String tipo,
        String zona,
        Double condominio,
        boolean academia,
        boolean elevador,
        boolean permitidoAnimais,
        boolean piscina,
        boolean portaria,
        boolean salaoFestas,
        boolean condominioFechado,
        boolean seguranca24h,
        boolean portaoEletronico,
        boolean areaMurada,
        boolean areaServico,
        boolean armariosCozinha,
        boolean armariosQuarto,
        boolean churrasqueira,
        boolean mobiliado,
        boolean quartoServico,
        boolean arCondicionado,
        boolean porteiro24h,
        boolean varanda
) {

    // O dataset de treino registra "5 ou mais" como 5; valores acima disso ficariam fora da distribuicao do modelo.
    static final int LIMITE_CONTAGEM_DATASET = 5;

    public static ImovelFeatures from(EstimativaRequest request) {
        var amenidades = request.amenidades();
        return new ImovelFeatures(
                request.bairroOuCep(),
                request.areaM2(),
                Math.min(request.quartos(), LIMITE_CONTAGEM_DATASET),
                Math.min(request.banheiros(), LIMITE_CONTAGEM_DATASET),
                Math.min(request.vagasGaragem(), LIMITE_CONTAGEM_DATASET),
                request.categoria().getRotulo(),
                request.tipo().getRotulo(),
                request.zona() == null ? null : request.zona().name(),
                request.condominio(),
                amenidades.academia(),
                amenidades.elevador(),
                amenidades.permitidoAnimais(),
                amenidades.piscina(),
                amenidades.portaria(),
                amenidades.salaoFestas(),
                amenidades.condominioFechado(),
                amenidades.seguranca24h(),
                amenidades.portaoEletronico(),
                amenidades.areaMurada(),
                amenidades.areaServico(),
                amenidades.armariosCozinha(),
                amenidades.armariosQuarto(),
                amenidades.churrasqueira(),
                amenidades.mobiliado(),
                amenidades.quartoServico(),
                amenidades.arCondicionado(),
                amenidades.porteiro24h(),
                amenidades.varanda()
        );
    }
}
