package com.gaio.calculadora.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class GeocodingServiceTest {

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "Rua Augusta, 2000|Rua Augusta",
            "Rua Augusta 2000|Rua Augusta",
            "Av. Paulista, nº 1578, Bela Vista|Av. Paulista, Bela Vista",
            "Rua Domingos de Morais 100A|Rua Domingos de Morais",
            "Vila Mariana|Vila Mariana"
    })
    void removerNumeroDeixaSoORestoDoEndereco(String entrada, String esperado) {
        assertThat(GeocodingService.removerNumero(entrada)).isEqualTo(esperado);
    }
}
