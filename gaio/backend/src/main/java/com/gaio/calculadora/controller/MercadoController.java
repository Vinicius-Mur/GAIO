package com.gaio.calculadora.controller;

import com.gaio.calculadora.dto.MercadoBairroResponse;
import com.gaio.calculadora.dto.MercadoResumoResponse;
import com.gaio.calculadora.exception.RecursoNaoEncontradoException;
import com.gaio.calculadora.service.ml.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    private final MlPredictionService mlPredictionService;

    public MercadoController(MlPredictionService mlPredictionService) {
        this.mlPredictionService = mlPredictionService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<MercadoResumoResponse> resumo() {
        return ResponseEntity.ok(mlPredictionService.resumoDoMercado());
    }

    @GetMapping("/bairro")
    public ResponseEntity<MercadoBairroResponse> bairro(@RequestParam String nome) {
        return mlPredictionService.mercadoDoBairro(nome)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Não temos anúncios de \"" + nome + "\" na base. A estimativa cobre a cidade de São Paulo."));
    }
}
