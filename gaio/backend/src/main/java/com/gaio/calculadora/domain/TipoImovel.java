package com.gaio.calculadora.domain;

public enum TipoImovel {

    PADRAO("Padrão"),
    COBERTURA("Cobertura"),
    CASA_DE_CONDOMINIO("Casa de condomínio"),
    CASA_DE_VILA("Casa de vila"),
    DUPLEX_OU_TRIPLEX("Duplex ou triplex"),
    KITNET("Kitnet"),
    LOFT("Loft");

    private final String rotulo;

    TipoImovel(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
