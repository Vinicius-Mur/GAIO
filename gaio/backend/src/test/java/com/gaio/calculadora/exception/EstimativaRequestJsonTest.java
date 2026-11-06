package com.gaio.calculadora.exception;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Zona;
import com.gaio.calculadora.dto.EstimativaRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class EstimativaRequestJsonTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    private static final String JSON_VALIDO = """
            {
              "bairroOuCep": "Vila Mariana",
              "areaM2": 105,
              "quartos": 3,
              "banheiros": 2,
              "vagasGaragem": 2,
              "categoria": "APARTAMENTOS",
              "tipo": "PADRAO",
              "zona": "SUL",
              "condominio": 850.0,
              "amenidades": { "piscina": true, "elevador": true }
            }
            """;

    @Test
    void deveDesserializarEnumsPeloNomeDaConstanteEAmenidadesAusentesComoFalse() {
        EstimativaRequest request = mapper.readValue(JSON_VALIDO, EstimativaRequest.class);

        assertThat(request.categoria()).isEqualTo(CategoriaImovel.APARTAMENTOS);
        assertThat(request.tipo()).isEqualTo(TipoImovel.PADRAO);
        assertThat(request.zona()).isEqualTo(Zona.SUL);
        assertThat(request.amenidades().piscina()).isTrue();
        assertThat(request.amenidades().elevador()).isTrue();
        assertThat(request.amenidades().academia()).isFalse();
        assertThat(request.amenidades().varanda()).isFalse();
    }

    @Test
    void zonaPodeSerOmitida() {
        EstimativaRequest request = mapper.readValue(JSON_VALIDO.replace("\"zona\": \"SUL\",", ""), EstimativaRequest.class);

        assertThat(request.zona()).isNull();
        assertThat(request.categoria()).isEqualTo(CategoriaImovel.APARTAMENTOS);
    }

    @Test
    void enumInvalidoDeveGerarMensagemComCampoEValoresAceitos() {
        String jsonComRotuloNoLugarDaConstante = JSON_VALIDO.replace("\"PADRAO\"", "\"Padrão\"");
        JacksonException erroJackson = catchThrowableOfType(JacksonException.class,
                () -> mapper.readValue(jsonComRotuloNoLugarDaConstante, EstimativaRequest.class));

        ResponseEntity<ApiErrorResponse> resposta = new GlobalExceptionHandler().handleCorpoInvalido(
                new HttpMessageNotReadableException("JSON inválido", erroJackson, new MockHttpInputMessage(new byte[0])));

        assertThat(resposta.getStatusCode().value()).isEqualTo(400);
        assertThat(resposta.getBody().mensagens()).singleElement().asString()
                .startsWith("tipo: valor inválido")
                .contains("PADRAO", "COBERTURA", "KITNET");
    }

    @Test
    void jsonMalFormadoDeveGerarMensagemGenerica() {
        ResponseEntity<ApiErrorResponse> resposta = new GlobalExceptionHandler().handleCorpoInvalido(
                new HttpMessageNotReadableException("JSON inválido", new MockHttpInputMessage(new byte[0])));

        assertThat(resposta.getStatusCode().value()).isEqualTo(400);
        assertThat(resposta.getBody().mensagens()).containsExactly("Corpo da requisição inválido ou mal formatado");
    }
}
