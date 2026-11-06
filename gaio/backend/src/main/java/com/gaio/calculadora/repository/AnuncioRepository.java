package com.gaio.calculadora.repository;

import com.gaio.calculadora.domain.Anuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AnuncioRepository extends JpaRepository<Anuncio, Long>, JpaSpecificationExecutor<Anuncio> {

    boolean existsByEstimativaId(Long estimativaId);
}
