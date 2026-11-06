package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.Anuncio;
import com.gaio.calculadora.domain.AnuncioStatus;
import com.gaio.calculadora.domain.Estimativa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AnuncioResponse(
        Long id,
        Long estimativaId,
        String bairro,
        String enderecoCompleto,
        String titulo,
        String descricao,
        AnuncioStatus status,
        boolean publicado,
        BigDecimal valorEstimado,
        BigDecimal faixaMinima,
        BigDecimal faixaMaxima,
        Double confianca,
        List<String> dicasFotos,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static AnuncioResponse from(Anuncio anuncio, List<String> dicasFotos) {
        Estimativa estimativa = anuncio.getEstimativa();
        return new AnuncioResponse(
                anuncio.getId(),
                estimativa.getId(),
                anuncio.getBairro(),
                anuncio.getEnderecoCompleto(),
                anuncio.getTitulo(),
                anuncio.getDescricao(),
                anuncio.getStatus(),
                anuncio.isPublicado(),
                estimativa.getValorEstimado(),
                estimativa.getFaixaMinima(),
                estimativa.getFaixaMaxima(),
                estimativa.getConfianca(),
                dicasFotos,
                anuncio.getCriadoEm(),
                anuncio.getAtualizadoEm()
        );
    }
}
