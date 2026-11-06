package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.EstimativaRequest;
import com.gaio.calculadora.dto.EstimativaResponse;
import com.gaio.calculadora.dto.EstimativaSalvaResponse;
import com.gaio.calculadora.dto.SalvarEstimativaRequest;
import com.gaio.calculadora.exception.RecursoNaoEncontradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.AnuncioRepository;
import com.gaio.calculadora.repository.EstimativaRepository;
import com.gaio.calculadora.security.AutenticacaoUtil;
import com.gaio.calculadora.service.ml.ImovelFeatures;
import com.gaio.calculadora.service.ml.MlPredictionService;
import com.gaio.calculadora.service.ml.PredicaoImovel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EstimativaService {

    private final MlPredictionService mlPredictionService;
    private final DicasService dicasService;
    private final EstimativaRepository estimativaRepository;
    private final AnuncioRepository anuncioRepository;

    public EstimativaService(MlPredictionService mlPredictionService,
                              DicasService dicasService,
                              EstimativaRepository estimativaRepository,
                              AnuncioRepository anuncioRepository) {
        this.mlPredictionService = mlPredictionService;
        this.dicasService = dicasService;
        this.estimativaRepository = estimativaRepository;
        this.anuncioRepository = anuncioRepository;
    }

    public EstimativaResponse calcular(EstimativaRequest request) {
        PredicaoImovel predicao = mlPredictionService.prever(ImovelFeatures.from(request));
        List<String> dicasFotos = dicasService.gerarDicasFotos(request);

        EstimativaResponse.ParametrosUtilizados parametros = new EstimativaResponse.ParametrosUtilizados(
                request.bairroOuCep(),
                request.areaM2(),
                request.quartos(),
                request.banheiros(),
                request.vagasGaragem(),
                request.categoria(),
                request.tipo(),
                request.zona(),
                request.condominio(),
                request.amenidades()
        );

        return new EstimativaResponse(
                predicao.valorEstimado(),
                predicao.faixaMinima(),
                predicao.faixaMaxima(),
                predicao.confianca(),
                parametros,
                predicao.insightsMercado(),
                dicasFotos,
                predicao.referenciaMercado()
        );
    }

    public EstimativaSalvaResponse salvar(SalvarEstimativaRequest request) {
        EstimativaRequest parametros = request.parametros();

        Estimativa estimativa = Estimativa.builder()
                .bairroOuCep(parametros.bairroOuCep())
                .areaM2(parametros.areaM2())
                .quartos(parametros.quartos())
                .banheiros(parametros.banheiros())
                .vagasGaragem(parametros.vagasGaragem())
                .categoria(parametros.categoria())
                .tipo(parametros.tipo())
                .zona(parametros.zona())
                .condominio(parametros.condominio())
                .amenidades(parametros.amenidades().toDomain())
                .valorEstimado(request.valorEstimado())
                .faixaMinima(request.faixaMinima())
                .faixaMaxima(request.faixaMaxima())
                .confianca(request.confianca())
                .insightsMercado(request.insightsMercado() == null ? new ArrayList<>() : new ArrayList<>(request.insightsMercado()))
                .referenciaMercado(request.referenciaMercado() == null ? null : request.referenciaMercado().toDomain())
                .usuario(AutenticacaoUtil.usuarioAutenticado().orElse(null))
                .build();

        Estimativa salva = estimativaRepository.save(estimativa);
        return paraResposta(salva);
    }

    public List<EstimativaSalvaResponse> listarHistorico(Usuario usuarioLogado) {
        return estimativaRepository.findAllByUsuarioIdOrderByCriadoEmDesc(usuarioLogado.getId()).stream()
                .map(this::paraResposta)
                .toList();
    }

    public EstimativaSalvaResponse buscarPorId(Usuario usuarioLogado, Long id) {
        return paraResposta(buscarDoUsuario(usuarioLogado, id));
    }

    public void excluir(Usuario usuarioLogado, Long id) {
        Estimativa estimativa = buscarDoUsuario(usuarioLogado, id);
        if (anuncioRepository.existsByEstimativaId(id)) {
            throw new RegraNegocioException("Esta estimativa tem um anúncio vinculado. Exclua o anúncio antes de excluir a estimativa.");
        }
        estimativaRepository.delete(estimativa);
    }

    private EstimativaSalvaResponse paraResposta(Estimativa estimativa) {
        List<String> dicas = dicasService.gerarDicasFotos(
                estimativa.getQuartos(), estimativa.getBanheiros(), estimativa.getVagasGaragem());
        return EstimativaSalvaResponse.from(estimativa, dicas);
    }

    private Estimativa buscarDoUsuario(Usuario usuarioLogado, Long id) {
        return estimativaRepository.findById(id)
                .filter(e -> e.getUsuario() != null && e.getUsuario().getId().equals(usuarioLogado.getId()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Estimativa não encontrada: " + id));
    }
}
