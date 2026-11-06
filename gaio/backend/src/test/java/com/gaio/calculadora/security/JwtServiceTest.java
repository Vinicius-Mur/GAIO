package com.gaio.calculadora.security;

import com.gaio.calculadora.domain.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SEGREDO_DE_TESTE = "segredo-de-teste-bem-longo-para-passar-no-tamanho-minimo-hmac";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SEGREDO_DE_TESTE, 60_000L);
    }

    @Test
    void tokenGeradoDeveSerValidoEConterOEmailDoUsuario() {
        Usuario usuario = Usuario.builder().id(1L).nome("Guilherme").email("g@teste.com").build();

        String token = jwtService.gerarToken(usuario);

        assertThat(jwtService.tokenValido(token)).isTrue();
        assertThat(jwtService.extrairEmail(token)).isEqualTo("g@teste.com");
    }

    @Test
    void tokenInvalidoOuAdulteradoNaoDeveSerValido() {
        assertThat(jwtService.tokenValido("token-invalido-qualquer")).isFalse();
    }

    @Test
    void tokenAssinadoComOutraChaveNaoDeveSerValido() {
        Usuario usuario = Usuario.builder().id(1L).nome("Guilherme").email("g@teste.com").build();
        JwtService outroServico = new JwtService("outra-chave-secreta-completamente-diferente-e-longa", 60_000L);

        String tokenDeOutraChave = outroServico.gerarToken(usuario);

        assertThat(jwtService.tokenValido(tokenDeOutraChave)).isFalse();
    }
}
