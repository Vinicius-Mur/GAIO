package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Anuncio;
import com.gaio.calculadora.domain.AnuncioStatus;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.AnuncioResponse;
import com.gaio.calculadora.dto.AtualizarAnuncioRequest;
import com.gaio.calculadora.dto.CriarAnuncioRequest;
import com.gaio.calculadora.exception.RecursoNaoEncontradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.AnuncioRepository;
import com.gaio.calculadora.repository.EstimativaRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AnuncioService {

    private final AnuncioRepository anuncioRepository;
    private final EstimativaRepository estimativaRepository;
    private final AnuncioDescricaoService anuncioDescricaoService;
    private final DicasService dicasService;

    public AnuncioService(AnuncioRepository anuncioRepository,
                           EstimativaRepository estimativaRepository,
                           AnuncioDescricaoService anuncioDescricaoService,
                           DicasService dicasService) {
        this.anuncioRepository = anuncioRepository;
        this.estimativaRepository = estimativaRepository;
        this.anuncioDescricaoService = anuncioDescricaoService;
        this.dicasService = dicasService;
    }

    @Transactional
    public AnuncioResponse criar(Usuario usuarioLogado, CriarAnuncioRequest request) {
        Estimativa estimativa = estimativaRepository.findById(request.estimativaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Estimativa não encontrada: " + request.estimativaId()));

        if (estimativa.getUsuario() == null) {
            estimativa.setUsuario(usuarioLogado);
        } else if (!estimativa.getUsuario().getId().equals(usuarioLogado.getId())) {
            throw new RecursoNaoEncontradoException("Estimativa não encontrada: " + request.estimativaId());
        }

        if (anuncioRepository.existsByEstimativaId(estimativa.getId())) {
            throw new RegraNegocioException("Esta estimativa já tem um anúncio. Cada estimativa gera um único anúncio.");
        }

        String titulo = anuncioDescricaoService.gerarTitulo(estimativa, request.bairro());
        String descricao = anuncioDescricaoService.gerarDescricao(estimativa, request.bairro(), request.enderecoCompleto());

        Anuncio anuncio = Anuncio.builder()
                .usuario(usuarioLogado)
                .estimativa(estimativa)
                .bairro(request.bairro())
                .enderecoCompleto(request.enderecoCompleto())
                .titulo(titulo)
                .descricao(descricao)
                .status(AnuncioStatus.RASCUNHO)
                .publicado(false)
                .build();

        Anuncio salvo = anuncioRepository.save(anuncio);
        return toResponse(salvo);
    }

    public List<AnuncioResponse> listar(Usuario usuarioLogado, Long id, String bairro, AnuncioStatus status) {
        Specification<Anuncio> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            predicados.add(cb.equal(root.get("usuario").get("id"), usuarioLogado.getId()));

            if (id != null) {
                predicados.add(cb.equal(root.get("id"), id));
            }
            if (bairro != null && !bairro.isBlank()) {
                predicados.add(cb.like(cb.lower(root.get("bairro")), "%" + bairro.toLowerCase() + "%"));
            }
            if (status != null) {
                predicados.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };

        return anuncioRepository.findAll(filtro).stream()
                .map(this::toResponse)
                .toList();
    }

    public AnuncioResponse buscarPorId(Usuario usuarioLogado, Long id) {
        Anuncio anuncio = buscarDoUsuario(usuarioLogado, id);
        return toResponse(anuncio);
    }

    @Transactional
    public AnuncioResponse atualizar(Usuario usuarioLogado, Long id, AtualizarAnuncioRequest request) {
        Anuncio anuncio = buscarDoUsuario(usuarioLogado, id);

        if (request.titulo() != null) {
            anuncio.setTitulo(request.titulo());
        }
        if (request.descricao() != null) {
            anuncio.setDescricao(request.descricao());
        }
        if (request.status() != null) {
            anuncio.setStatus(request.status());
        }
        if (request.publicado() != null) {
            anuncio.setPublicado(request.publicado());
        }

        if (anuncio.isPublicado() && anuncio.getStatus() != AnuncioStatus.COMPLETO) {
            throw new RegraNegocioException(
                    "Anúncio precisa estar com status COMPLETO antes de ser marcado como publicado.");
        }

        Anuncio salvo = anuncioRepository.save(anuncio);
        return toResponse(salvo);
    }

    @Transactional
    public void excluir(Usuario usuarioLogado, Long id) {
        anuncioRepository.delete(buscarDoUsuario(usuarioLogado, id));
    }

    private Anuncio buscarDoUsuario(Usuario usuarioLogado, Long id) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio não encontrado: " + id));

        if (!anuncio.getUsuario().getId().equals(usuarioLogado.getId())) {
            throw new RecursoNaoEncontradoException("Anúncio não encontrado: " + id);
        }

        return anuncio;
    }

    private AnuncioResponse toResponse(Anuncio anuncio) {
        Estimativa estimativa = anuncio.getEstimativa();
        List<String> dicasFotos = dicasService.gerarDicasFotos(
                estimativa.getQuartos(), estimativa.getBanheiros(), estimativa.getVagasGaragem());
        return AnuncioResponse.from(anuncio, dicasFotos);
    }
}
