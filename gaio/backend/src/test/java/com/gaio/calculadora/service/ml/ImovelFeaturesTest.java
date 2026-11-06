package com.gaio.calculadora.service.ml;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Zona;
import com.gaio.calculadora.dto.Amenidades;
import com.gaio.calculadora.dto.EstimativaRequest;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ImovelFeaturesTest {

    private EstimativaRequest request(int quartos, int banheiros, int vagas, Amenidades amenidades) {
        return new EstimativaRequest("Alto da Lapa", 163.0, quartos, banheiros, vagas,
                CategoriaImovel.APARTAMENTOS, TipoImovel.CASA_DE_CONDOMINIO, Zona.OESTE, 1790.0,
                amenidades, null);
    }

    @Test
    void deveUsarRotulosExatosDoDatasetParaCategoriaTipoEZona() {
        ImovelFeatures features = ImovelFeatures.from(request(3, 2, 2, Amenidades.vazio()));

        assertThat(features.categoria()).isEqualTo("Apartamentos");
        assertThat(features.tipo()).isEqualTo("Casa de condomínio");
        assertThat(features.zona()).isEqualTo("OESTE");
    }

    @Test
    void deveLimitarContagensAoTetoDoDataset() {
        ImovelFeatures features = ImovelFeatures.from(request(7, 6, 9, Amenidades.vazio()));

        assertThat(features.quartos()).isEqualTo(5);
        assertThat(features.banheiros()).isEqualTo(5);
        assertThat(features.vagasGaragem()).isEqualTo(5);
    }

    @Test
    void naoDeveAlterarContagensDentroDoLimite() {
        ImovelFeatures features = ImovelFeatures.from(request(5, 1, 0, Amenidades.vazio()));

        assertThat(features.quartos()).isEqualTo(5);
        assertThat(features.banheiros()).isEqualTo(1);
        assertThat(features.vagasGaragem()).isZero();
    }

    @Test
    void zonaAusenteDeveIrComoNuloParaOServicoDeduzirPeloBairro() {
        EstimativaRequest semZona = new EstimativaRequest("Alto da Lapa", 163.0, 3, 2, 2,
                CategoriaImovel.APARTAMENTOS, TipoImovel.PADRAO, null, 1790.0, Amenidades.vazio(), null);

        assertThat(ImovelFeatures.from(semZona).zona()).isNull();
    }

    @Test
    void deveRepassarAmenidadesMarcadas() {
        Amenidades amenidades = new Amenidades(
                true, null, null, true, null, null, null, true, null,
                null, null, null, null, null, null, null, null, null, true);

        ImovelFeatures features = ImovelFeatures.from(request(3, 2, 2, amenidades));

        assertThat(features.academia()).isTrue();
        assertThat(features.piscina()).isTrue();
        assertThat(features.seguranca24h()).isTrue();
        assertThat(features.varanda()).isTrue();
        assertThat(features.elevador()).isFalse();
        assertThat(features.porteiro24h()).isFalse();
    }
}
