package com.gaio.calculadora.domain;

public enum CategoriaImovel {

    APARTAMENTOS("Apartamentos"),
    CASAS("Casas");

    private final String rotulo;

    CategoriaImovel(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
