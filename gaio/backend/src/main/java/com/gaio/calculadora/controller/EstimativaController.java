package com.gaio.calculadora.controller;

import com.gaio.calculadora.dto.EstimativaRequest;
import com.gaio.calculadora.dto.EstimativaResponse;
import com.gaio.calculadora.dto.EstimativaSalvaResponse;
import com.gaio.calculadora.dto.SalvarEstimativaRequest;
import com.gaio.calculadora.security.AutenticacaoUtil;
import com.gaio.calculadora.service.EstimativaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estimativas")
public class EstimativaController {

    private final EstimativaService estimativaService;

    public EstimativaController(EstimativaService estimativaService) {
        this.estimativaService = estimativaService;
    }

    @PostMapping("/calcular")
    public ResponseEntity<EstimativaResponse> calcular(@Valid @RequestBody EstimativaRequest request) {
        return ResponseEntity.ok(estimativaService.calcular(request));
    }

    @PostMapping
    public ResponseEntity<EstimativaSalvaResponse> salvar(@Valid @RequestBody SalvarEstimativaRequest request) {
        EstimativaSalvaResponse salva = estimativaService.salvar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping
    public ResponseEntity<List<EstimativaSalvaResponse>> listarHistorico() {
        return ResponseEntity.ok(estimativaService.listarHistorico(AutenticacaoUtil.exigirUsuarioAutenticado()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        estimativaService.excluir(AutenticacaoUtil.exigirUsuarioAutenticado(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstimativaSalvaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(estimativaService.buscarPorId(AutenticacaoUtil.exigirUsuarioAutenticado(), id));
    }
}
