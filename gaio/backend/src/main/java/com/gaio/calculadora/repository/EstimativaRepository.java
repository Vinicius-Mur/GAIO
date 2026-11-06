package com.gaio.calculadora.repository;

import com.gaio.calculadora.domain.Estimativa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstimativaRepository extends JpaRepository<Estimativa, Long> {

    List<Estimativa> findAllByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);
}
