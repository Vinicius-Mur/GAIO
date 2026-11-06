package com.gaio.calculadora.controller;

import com.gaio.calculadora.domain.AnuncioStatus;
import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.AnuncioResponse;
import com.gaio.calculadora.dto.AtualizarAnuncioRequest;
import com.gaio.calculadora.dto.CriarAnuncioRequest;
import com.gaio.calculadora.security.AutenticacaoUtil;
import com.gaio.calculadora.service.AnuncioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/anuncios")
public class AnuncioController {

    private final AnuncioService anuncioService;

    public AnuncioController(AnuncioService anuncioService) {
        this.anuncioService = anuncioService;
    }

    @PostMapping
    public ResponseEntity<AnuncioResponse> criar(@Valid @RequestBody CriarAnuncioRequest request) {
        Usuario usuario = AutenticacaoUtil.exigirUsuarioAutenticado();
        AnuncioResponse criado = anuncioService.criar(usuario, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @GetMapping
    public ResponseEntity<List<AnuncioResponse>> listar(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) AnuncioStatus status) {
        Usuario usuario = AutenticacaoUtil.exigirUsuarioAutenticado();
        return ResponseEntity.ok(anuncioService.listar(usuario, id, bairro, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnuncioResponse> buscarPorId(@PathVariable Long id) {
        Usuario usuario = AutenticacaoUtil.exigirUsuarioAutenticado();
        return ResponseEntity.ok(anuncioService.buscarPorId(usuario, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        anuncioService.excluir(AutenticacaoUtil.exigirUsuarioAutenticado(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AnuncioResponse> atualizar(@PathVariable Long id,
                                                       @RequestBody AtualizarAnuncioRequest request) {
        Usuario usuario = AutenticacaoUtil.exigirUsuarioAutenticado();
        return ResponseEntity.ok(anuncioService.atualizar(usuario, id, request));
    }
}
