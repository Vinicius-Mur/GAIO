package com.gaio.calculadora.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DicasServiceTest {

    private final DicasService dicasService = new DicasService();

    @Test
    void deveIncluirDicaDeQuartoQuandoHouverQuartos() {
        List<String> dicas = dicasService.gerarDicasFotos(2, 0, 0);

        assertThat(dicas).anyMatch(dica -> dica.contains("quarto principal"));
    }

    @Test
    void naoDeveIncluirDicaDeQuartoQuandoNaoHouverQuartos() {
        List<String> dicas = dicasService.gerarDicasFotos(0, 1, 0);

        assertThat(dicas).noneMatch(dica -> dica.contains("quarto principal"));
    }

    @Test
    void deveIncluirDicaDeBanheiroSomenteQuandoHouverBanheiro() {
        assertThat(dicasService.gerarDicasFotos(1, 1, 0))
                .anyMatch(dica -> dica.contains("banheiro"));

        assertThat(dicasService.gerarDicasFotos(1, 0, 0))
                .noneMatch(dica -> dica.contains("banheiro"));
    }

    @Test
    void deveIncluirDicaDeGaragemSomenteQuandoHouverVaga() {
        assertThat(dicasService.gerarDicasFotos(1, 1, 2))
                .anyMatch(dica -> dica.contains("garagem"));

        assertThat(dicasService.gerarDicasFotos(1, 1, 0))
                .noneMatch(dica -> dica.contains("garagem"));
    }

    @Test
    void deveSempreIncluirDicasGeraisDeCozinhaSalaEIluminacao() {
        List<String> dicas = dicasService.gerarDicasFotos(0, 0, 0);

        assertThat(dicas)
                .anyMatch(dica -> dica.contains("cozinha"))
                .anyMatch(dica -> dica.contains("sala"))
                .anyMatch(dica -> dica.toLowerCase().contains("escuras"));
    }
}
