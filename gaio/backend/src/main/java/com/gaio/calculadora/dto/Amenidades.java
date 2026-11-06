package com.gaio.calculadora.dto;

public record Amenidades(
        Boolean academia,
        Boolean elevador,
        Boolean permitidoAnimais,
        Boolean piscina,
        Boolean portaria,
        Boolean salaoFestas,
        Boolean condominioFechado,
        Boolean seguranca24h,
        Boolean portaoEletronico,
        Boolean areaMurada,
        Boolean areaServico,
        Boolean armariosCozinha,
        Boolean armariosQuarto,
        Boolean churrasqueira,
        Boolean mobiliado,
        Boolean quartoServico,
        Boolean arCondicionado,
        Boolean porteiro24h,
        Boolean varanda
) {

    public Amenidades {
        academia = Boolean.TRUE.equals(academia);
        elevador = Boolean.TRUE.equals(elevador);
        permitidoAnimais = Boolean.TRUE.equals(permitidoAnimais);
        piscina = Boolean.TRUE.equals(piscina);
        portaria = Boolean.TRUE.equals(portaria);
        salaoFestas = Boolean.TRUE.equals(salaoFestas);
        condominioFechado = Boolean.TRUE.equals(condominioFechado);
        seguranca24h = Boolean.TRUE.equals(seguranca24h);
        portaoEletronico = Boolean.TRUE.equals(portaoEletronico);
        areaMurada = Boolean.TRUE.equals(areaMurada);
        areaServico = Boolean.TRUE.equals(areaServico);
        armariosCozinha = Boolean.TRUE.equals(armariosCozinha);
        armariosQuarto = Boolean.TRUE.equals(armariosQuarto);
        churrasqueira = Boolean.TRUE.equals(churrasqueira);
        mobiliado = Boolean.TRUE.equals(mobiliado);
        quartoServico = Boolean.TRUE.equals(quartoServico);
        arCondicionado = Boolean.TRUE.equals(arCondicionado);
        porteiro24h = Boolean.TRUE.equals(porteiro24h);
        varanda = Boolean.TRUE.equals(varanda);
    }

    public static Amenidades vazio() {
        return new Amenidades(
                null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null
        );
    }

    public static Amenidades from(com.gaio.calculadora.domain.Amenidades amenidades) {
        return new Amenidades(
                amenidades.isAcademia(),
                amenidades.isElevador(),
                amenidades.isPermitidoAnimais(),
                amenidades.isPiscina(),
                amenidades.isPortaria(),
                amenidades.isSalaoFestas(),
                amenidades.isCondominioFechado(),
                amenidades.isSeguranca24h(),
                amenidades.isPortaoEletronico(),
                amenidades.isAreaMurada(),
                amenidades.isAreaServico(),
                amenidades.isArmariosCozinha(),
                amenidades.isArmariosQuarto(),
                amenidades.isChurrasqueira(),
                amenidades.isMobiliado(),
                amenidades.isQuartoServico(),
                amenidades.isArCondicionado(),
                amenidades.isPorteiro24h(),
                amenidades.isVaranda()
        );
    }

    public com.gaio.calculadora.domain.Amenidades toDomain() {
        return com.gaio.calculadora.domain.Amenidades.builder()
                .academia(academia)
                .elevador(elevador)
                .permitidoAnimais(permitidoAnimais)
                .piscina(piscina)
                .portaria(portaria)
                .salaoFestas(salaoFestas)
                .condominioFechado(condominioFechado)
                .seguranca24h(seguranca24h)
                .portaoEletronico(portaoEletronico)
                .areaMurada(areaMurada)
                .areaServico(areaServico)
                .armariosCozinha(armariosCozinha)
                .armariosQuarto(armariosQuarto)
                .churrasqueira(churrasqueira)
                .mobiliado(mobiliado)
                .quartoServico(quartoServico)
                .arCondicionado(arCondicionado)
                .porteiro24h(porteiro24h)
                .varanda(varanda)
                .build();
    }
}
