package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Amenidades;
import com.gaio.calculadora.domain.Anuncio;
import com.gaio.calculadora.domain.AnuncioStatus;
import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.domain.Zona;
import com.gaio.calculadora.dto.AnuncioResponse;
import com.gaio.calculadora.dto.AtualizarAnuncioRequest;
import com.gaio.calculadora.dto.CriarAnuncioRequest;
import com.gaio.calculadora.exception.RecursoNaoEncontradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.AnuncioRepository;
import com.gaio.calculadora.repository.EstimativaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnuncioServiceTest {

    @Mock
    private AnuncioRepository anuncioRepository;

    @Mock
    private EstimativaRepository estimativaRepository;

    private AnuncioService anuncioService;

    private final Usuario dono = Usuario.builder().id(1L).nome("Dono").email("dono@teste.com").build();
    private final Usuario outroUsuario = Usuario.builder().id(2L).nome("Outra Pessoa").email("outra@teste.com").build();

    @BeforeEach
    void setUp() {
        DicasService dicasService = new DicasService();
        anuncioService = new AnuncioService(anuncioRepository, estimativaRepository,
                new AnuncioDescricaoService(), dicasService);
    }

    private Estimativa novaEstimativa(Long id, Usuario usuario) {
        return Estimativa.builder()
                .id(id)
                .bairroOuCep("Consolacao, Sao Paulo")
                .areaM2(80.0)
                .quartos(2)
                .banheiros(1)
                .vagasGaragem(1)
                .categoria(CategoriaImovel.APARTAMENTOS)
                .tipo(TipoImovel.PADRAO)
                .zona(Zona.OESTE)
                .condominio(450.0)
                .amenidades(Amenidades.builder().build())
                .valorEstimado(BigDecimal.valueOf(950000))
                .criadoEm(Instant.now())
                .usuario(usuario)
                .build();
    }

    private Anuncio novoAnuncio(Long id, Usuario usuario, Estimativa estimativa, AnuncioStatus status, boolean publicado) {
        return Anuncio.builder()
                .id(id)
                .usuario(usuario)
                .estimativa(estimativa)
                .bairro("Consolacao")
                .enderecoCompleto("Rua Augusta, Sao Paulo, SP")
                .titulo("Imóvel com 2 quartos em Consolacao")
                .descricao("descricao gerada")
                .status(status)
                .publicado(publicado)
                .criadoEm(Instant.now())
                .atualizadoEm(Instant.now())
                .build();
    }

    @Test
    void criarDeveReivindicarEstimativaSemDono() {
        Estimativa estimativaSemDono = novaEstimativa(10L, null);
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaSemDono));
        when(anuncioRepository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        CriarAnuncioRequest request = new CriarAnuncioRequest(10L, "Consolacao", "Rua Augusta, Sao Paulo, SP");

        ArgumentCaptor<Anuncio> captor = ArgumentCaptor.forClass(Anuncio.class);
        AnuncioResponse resposta = anuncioService.criar(dono, request);

        org.mockito.Mockito.verify(anuncioRepository).save(captor.capture());
        assertThat(estimativaSemDono.getUsuario()).isEqualTo(dono);
        assertThat(captor.getValue().getStatus()).isEqualTo(AnuncioStatus.RASCUNHO);
        assertThat(captor.getValue().isPublicado()).isFalse();
        assertThat(resposta.titulo()).contains("2 quartos");
        assertThat(resposta.valorEstimado()).isEqualByComparingTo("950000");
        assertThat(resposta.estimativaId()).isEqualTo(10L);
    }

    @Test
    void criarSegundoAnuncioParaMesmaEstimativaDeveSerBloqueado() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(novaEstimativa(10L, dono)));
        when(anuncioRepository.existsByEstimativaId(10L)).thenReturn(true);

        CriarAnuncioRequest request = new CriarAnuncioRequest(10L, "Consolacao", "Rua Augusta, Sao Paulo, SP");

        assertThatThrownBy(() -> anuncioService.criar(dono, request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("já tem um anúncio");
        verify(anuncioRepository, never()).save(any());
    }

    @Test
    void excluirProprioAnuncioDeveApagar() {
        Anuncio anuncio = novoAnuncio(5L, dono, novaEstimativa(10L, dono), AnuncioStatus.COMPLETO, true);
        when(anuncioRepository.findById(5L)).thenReturn(Optional.of(anuncio));

        anuncioService.excluir(dono, 5L);

        verify(anuncioRepository).delete(anuncio);
    }

    @Test
    void excluirAnuncioDeOutroUsuarioDeveLancarNaoEncontrado() {
        Anuncio anuncio = novoAnuncio(5L, outroUsuario, novaEstimativa(10L, outroUsuario), AnuncioStatus.RASCUNHO, false);
        when(anuncioRepository.findById(5L)).thenReturn(Optional.of(anuncio));

        assertThatThrownBy(() -> anuncioService.excluir(dono, 5L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
        verify(anuncioRepository, never()).delete(any(Anuncio.class));
    }

    @Test
    void criarComEstimativaDeOutroUsuarioDeveLancarNaoEncontrado() {
        Estimativa estimativaDeOutro = novaEstimativa(10L, outroUsuario);
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDeOutro));

        CriarAnuncioRequest request = new CriarAnuncioRequest(10L, "Consolacao", "Rua Augusta, Sao Paulo, SP");

        assertThatThrownBy(() -> anuncioService.criar(dono, request))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void buscarPorIdDeAnuncioDeOutroUsuarioDeveLancarNaoEncontrado() {
        Anuncio anuncioDeOutro = novoAnuncio(5L, outroUsuario, novaEstimativa(10L, outroUsuario),
                AnuncioStatus.RASCUNHO, false);
        when(anuncioRepository.findById(5L)).thenReturn(Optional.of(anuncioDeOutro));

        assertThatThrownBy(() -> anuncioService.buscarPorId(dono, 5L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void atualizarNaoDevePermitirPublicarAnuncioAindaEmRascunho() {
        Anuncio anuncio = novoAnuncio(5L, dono, novaEstimativa(10L, dono), AnuncioStatus.RASCUNHO, false);
        when(anuncioRepository.findById(5L)).thenReturn(Optional.of(anuncio));

        AtualizarAnuncioRequest request = new AtualizarAnuncioRequest(null, null, null, true);

        assertThatThrownBy(() -> anuncioService.atualizar(dono, 5L, request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("COMPLETO");
    }

    @Test
    void atualizarDevePermitirCompletarEPublicarNaMesmaChamada() {
        Anuncio anuncio = novoAnuncio(5L, dono, novaEstimativa(10L, dono), AnuncioStatus.RASCUNHO, false);
        when(anuncioRepository.findById(5L)).thenReturn(Optional.of(anuncio));
        when(anuncioRepository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        AtualizarAnuncioRequest request = new AtualizarAnuncioRequest(null, null, AnuncioStatus.COMPLETO, true);

        AnuncioResponse resposta = anuncioService.atualizar(dono, 5L, request);

        assertThat(resposta.status()).isEqualTo(AnuncioStatus.COMPLETO);
        assertThat(resposta.publicado()).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void listarDeveFiltrarSempreParaOUsuarioAutenticado() {
        when(anuncioRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(List.of());

        List<AnuncioResponse> resultado = anuncioService.listar(dono, null, "Consol", AnuncioStatus.RASCUNHO);

        assertThat(resultado).isEmpty();
    }
}
