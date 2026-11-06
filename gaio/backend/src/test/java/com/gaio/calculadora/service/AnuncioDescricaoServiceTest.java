package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.TipoImovel;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class AnuncioDescricaoServiceTest {

    private final AnuncioDescricaoService service = new AnuncioDescricaoService();

    @Test
    void tituloDeveUsarSingularQuandoHouverUmQuarto() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(1).banheiros(1).vagasGaragem(0)
                .areaM2(35.0).valorEstimado(BigDecimal.valueOf(300000))
                .build();

        String titulo = service.gerarTitulo(estimativa, "Bela Vista");

        assertThat(titulo).isEqualTo("Imóvel com 1 quarto no bairro Bela Vista");
    }

    @Test
    void tituloDeveUsarPluralQuandoHouverMaisDeUmQuarto() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(3).banheiros(2).vagasGaragem(2)
                .areaM2(105.0).valorEstimado(BigDecimal.valueOf(1000000))
                .build();

        String titulo = service.gerarTitulo(estimativa, "Vila Mariana");

        assertThat(titulo).isEqualTo("Imóvel com 3 quartos no bairro Vila Mariana");
    }

    @Test
    void descricaoDeveOmitirVagasDeGaragemQuandoNaoHouver() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(1).banheiros(1).vagasGaragem(0)
                .areaM2(35.0).valorEstimado(BigDecimal.valueOf(300000))
                .build();

        String descricao = service.gerarDescricao(estimativa, "Bela Vista", "Rua X, Sao Paulo, SP");

        assertThat(descricao).doesNotContain("vaga");
    }

    @Test
    void descricaoDeveIncluirVagasDeGaragemQuandoHouver() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(2).banheiros(1).vagasGaragem(1)
                .areaM2(80.0).valorEstimado(BigDecimal.valueOf(950000))
                .build();

        String descricao = service.gerarDescricao(estimativa, "Consolacao", "Rua Augusta, Sao Paulo, SP");

        assertThat(descricao).contains("1 vaga").contains("R$").contains("Consolacao");
    }

    @Test
    void tituloDeveUsarApartamentoQuandoCategoriaForApartamentosETipoPadrao() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(3).banheiros(2).vagasGaragem(2)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.PADRAO)
                .areaM2(105.0).valorEstimado(BigDecimal.valueOf(1000000))
                .build();

        String titulo = service.gerarTitulo(estimativa, "Vila Mariana");

        assertThat(titulo).isEqualTo("Apartamento com 3 quartos no bairro Vila Mariana");
    }

    @Test
    void tituloDeveUsarCasaQuandoCategoriaForCasasETipoPadrao() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(4).banheiros(4).vagasGaragem(4)
                .categoria(CategoriaImovel.CASAS).tipo(TipoImovel.PADRAO)
                .areaM2(390.0).valorEstimado(BigDecimal.valueOf(2500000))
                .build();

        String titulo = service.gerarTitulo(estimativa, "Vila Romana");

        assertThat(titulo).isEqualTo("Casa com 4 quartos no bairro Vila Romana");
    }

    @Test
    void tituloDeveUsarNomeDoTipoQuandoForMaisEspecificoQuePadrao() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(3).banheiros(4).vagasGaragem(3)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.COBERTURA)
                .areaM2(163.0).valorEstimado(BigDecimal.valueOf(2250000))
                .build();

        String titulo = service.gerarTitulo(estimativa, "Alto da Lapa");

        assertThat(titulo).isEqualTo("Cobertura com 3 quartos no bairro Alto da Lapa");
    }

    @Test
    void descricaoDeveIncluirCondominioQuandoHouver() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(2).banheiros(1).vagasGaragem(1)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.PADRAO)
                .condominio(500.0)
                .areaM2(80.0).valorEstimado(BigDecimal.valueOf(950000))
                .build();

        String descricao = service.gerarDescricao(estimativa, "Consolacao", "Rua Augusta, Sao Paulo, SP");

        assertThat(descricao).contains("Condomínio de");
    }

    @Test
    void descricaoDeCoberturaUsaFemininoEBairro() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(3).banheiros(1).vagasGaragem(1)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.COBERTURA)
                .condominio(900.0)
                .areaM2(100.0).valorEstimado(BigDecimal.valueOf(1019000))
                .build();

        String descricao = service.gerarDescricao(estimativa, "Consolação", "Rua Augusta, 5093");

        assertThat(descricao).startsWith("Cobertura localizada no bairro Consolação, Rua Augusta, 5093. ");
    }

    @Test
    void descricaoDeApartamentoUsaMasculinoESemEnderecoRepetido() {
        Estimativa estimativa = Estimativa.builder()
                .quartos(2).banheiros(1).vagasGaragem(0)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.PADRAO)
                .areaM2(60.0).valorEstimado(BigDecimal.valueOf(500000))
                .build();

        String descricao = service.gerarDescricao(estimativa, "Bela Vista", "Bela Vista");

        assertThat(descricao).startsWith("Apartamento localizado no bairro Bela Vista. ");
    }
}
