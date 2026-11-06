package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.domain.Zona;
import com.gaio.calculadora.dto.Amenidades;
import com.gaio.calculadora.dto.EstimativaRequest;
import com.gaio.calculadora.dto.EstimativaResponse;
import com.gaio.calculadora.dto.EstimativaSalvaResponse;
import com.gaio.calculadora.dto.ReferenciaMercado;
import com.gaio.calculadora.dto.SalvarEstimativaRequest;
import com.gaio.calculadora.exception.RecursoNaoEncontradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.AnuncioRepository;
import com.gaio.calculadora.repository.EstimativaRepository;
import com.gaio.calculadora.service.ml.MlPredictionService;
import com.gaio.calculadora.service.ml.PredicaoImovel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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
class EstimativaServiceTest {

    private static final ReferenciaMercado REFERENCIA =
            new ReferenciaMercado("Vila Mariana", "bairro", "Apartamentos", 900, 13000.0, 11000.0, 15500.0);

    @Mock
    private MlPredictionService mlPredictionService;

    @Mock
    private DicasService dicasService;

    @Mock
    private EstimativaRepository estimativaRepository;

    @Mock
    private AnuncioRepository anuncioRepository;

    private EstimativaService estimativaService;

    private final Usuario dono = Usuario.builder().id(1L).nome("Dono").email("dono@teste.com").build();
    private final Usuario outroUsuario = Usuario.builder().id(2L).nome("Outra Pessoa").email("outra@teste.com").build();

    private final EstimativaRequest requestPadrao = new EstimativaRequest(
            "Vila Mariana, Sao Paulo", 105.0, 3, 2, 2,
            CategoriaImovel.APARTAMENTOS, TipoImovel.PADRAO, Zona.OESTE, 450.0,
            Amenidades.vazio(), null);

    @BeforeEach
    void setUp() {
        estimativaService = new EstimativaService(mlPredictionService, dicasService, estimativaRepository, anuncioRepository);
    }

    @AfterEach
    void limparContextoSeguranca() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void calcularDeveCombinarPredicaoDoMlComDicasDeFotos() {
        PredicaoImovel predicao = new PredicaoImovel(
                BigDecimal.valueOf(1098500), BigDecimal.valueOf(1021605), BigDecimal.valueOf(1175395),
                0.7, List.of("Bairro valorizado"), REFERENCIA);
        when(mlPredictionService.prever(any())).thenReturn(predicao);
        when(dicasService.gerarDicasFotos(requestPadrao)).thenReturn(List.of("dica 1", "dica 2"));

        EstimativaResponse resposta = estimativaService.calcular(requestPadrao);

        assertThat(resposta.valorEstimado()).isEqualByComparingTo("1098500");
        assertThat(resposta.dicasFotos()).containsExactly("dica 1", "dica 2");
        assertThat(resposta.parametros().localizacao()).isEqualTo("Vila Mariana, Sao Paulo");
        assertThat(resposta.referenciaMercado()).isEqualTo(REFERENCIA);
    }

    @Test
    void salvarSemUsuarioAutenticadoDeveGravarEstimativaSemDono() {
        SalvarEstimativaRequest request = new SalvarEstimativaRequest(
                requestPadrao, BigDecimal.valueOf(950000), BigDecimal.valueOf(900000),
                BigDecimal.valueOf(1000000), 0.7, List.of("Insight A", "Insight B"), REFERENCIA);

        when(estimativaRepository.save(any())).thenAnswer(chamada -> {
            Estimativa e = chamada.getArgument(0);
            e.setId(1L);
            e.setCriadoEm(Instant.now());
            return e;
        });

        ArgumentCaptor<Estimativa> captor = ArgumentCaptor.forClass(Estimativa.class);

        EstimativaSalvaResponse salva = estimativaService.salvar(request);

        verify(estimativaRepository).save(captor.capture());
        assertThat(captor.getValue().getUsuario()).isNull();
        assertThat(captor.getValue().getInsightsMercado()).containsExactly("Insight A", "Insight B");
        assertThat(salva.insightsMercado()).containsExactly("Insight A", "Insight B");
        assertThat(salva.valorEstimado()).isEqualByComparingTo("950000");
        assertThat(captor.getValue().getReferenciaMercado().getPrecoM2Mediano()).isEqualTo(13000.0);
        assertThat(salva.referenciaMercado()).isEqualTo(REFERENCIA);
    }

    @Test
    void salvarComUsuarioAutenticadoDeveVincularEstimativaAoUsuario() {
        Usuario usuario = Usuario.builder().id(1L).nome("Guilherme").email("g@teste.com").build();
        autenticarComo(usuario);

        SalvarEstimativaRequest request = new SalvarEstimativaRequest(
                requestPadrao, BigDecimal.valueOf(950000), null, null, null, null, null);

        when(estimativaRepository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        ArgumentCaptor<Estimativa> captor = ArgumentCaptor.forClass(Estimativa.class);

        estimativaService.salvar(request);

        verify(estimativaRepository).save(captor.capture());
        assertThat(captor.getValue().getUsuario()).isEqualTo(usuario);
        assertThat(captor.getValue().getInsightsMercado()).isEmpty();
        assertThat(captor.getValue().getReferenciaMercado()).isNull();
    }

    @Test
    void buscarPorIdInexistenteDeveLancarExcecao() {
        when(estimativaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> estimativaService.buscarPorId(dono, 99L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void buscarPorIdDeEstimativaDeOutroUsuarioDeveLancarNaoEncontrado() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDe(10L, outroUsuario)));

        assertThatThrownBy(() -> estimativaService.buscarPorId(dono, 10L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void buscarPorIdDeEstimativaSemDonoDeveLancarNaoEncontrado() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDe(10L, null)));

        assertThatThrownBy(() -> estimativaService.buscarPorId(dono, 10L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void buscarPorIdDaPropriaEstimativaDeveRetornarOsDados() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDe(10L, dono)));

        EstimativaSalvaResponse resposta = estimativaService.buscarPorId(dono, 10L);

        assertThat(resposta.id()).isEqualTo(10L);
        assertThat(resposta.categoria()).isEqualTo(CategoriaImovel.APARTAMENTOS);
    }

    @Test
    void listarHistoricoDeveConsultarSomenteAsEstimativasDoUsuario() {
        when(estimativaRepository.findAllByUsuarioIdOrderByCriadoEmDesc(1L))
                .thenReturn(List.of(estimativaDe(10L, dono)));

        List<EstimativaSalvaResponse> historico = estimativaService.listarHistorico(dono);

        assertThat(historico).extracting(EstimativaSalvaResponse::id).containsExactly(10L);
        verify(estimativaRepository).findAllByUsuarioIdOrderByCriadoEmDesc(1L);
    }

    @Test
    void excluirPropriaEstimativaSemAnuncioDeveApagar() {
        Estimativa estimativa = estimativaDe(10L, dono);
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativa));
        when(anuncioRepository.existsByEstimativaId(10L)).thenReturn(false);

        estimativaService.excluir(dono, 10L);

        verify(estimativaRepository).delete(estimativa);
    }

    @Test
    void excluirEstimativaComAnuncioDeveSerBloqueado() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDe(10L, dono)));
        when(anuncioRepository.existsByEstimativaId(10L)).thenReturn(true);

        assertThatThrownBy(() -> estimativaService.excluir(dono, 10L))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("anúncio");
        verify(estimativaRepository, never()).delete(any());
    }

    @Test
    void excluirEstimativaDeOutroUsuarioDeveLancarNaoEncontrado() {
        when(estimativaRepository.findById(10L)).thenReturn(Optional.of(estimativaDe(10L, outroUsuario)));

        assertThatThrownBy(() -> estimativaService.excluir(dono, 10L))
                .isInstanceOf(RecursoNaoEncontradoException.class);
        verify(estimativaRepository, never()).delete(any());
    }

    private Estimativa estimativaDe(Long id, Usuario usuario) {
        return Estimativa.builder()
                .id(id)
                .bairroOuCep("Vila Mariana")
                .areaM2(105.0).quartos(3).banheiros(2).vagasGaragem(2)
                .categoria(CategoriaImovel.APARTAMENTOS).tipo(TipoImovel.PADRAO).zona(Zona.SUL).condominio(850.0)
                .amenidades(com.gaio.calculadora.domain.Amenidades.builder().build())
                .valorEstimado(BigDecimal.valueOf(1406000))
                .criadoEm(Instant.now())
                .usuario(usuario)
                .build();
    }

    private void autenticarComo(Usuario usuario) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, List.of()));
    }
}
