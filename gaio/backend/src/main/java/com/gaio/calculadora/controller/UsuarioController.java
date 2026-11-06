package com.gaio.calculadora.controller;

import com.gaio.calculadora.dto.AlterarSenhaRequest;
import com.gaio.calculadora.dto.AtualizarPerfilRequest;
import com.gaio.calculadora.dto.TokenResponse;
import com.gaio.calculadora.dto.UsuarioResponse;
import com.gaio.calculadora.security.AutenticacaoUtil;
import com.gaio.calculadora.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios/me")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<UsuarioResponse> perfil() {
        return ResponseEntity.ok(usuarioService.perfil(AutenticacaoUtil.exigirUsuarioAutenticado()));
    }

    @PutMapping
    public ResponseEntity<TokenResponse> atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequest request) {
        return ResponseEntity.ok(usuarioService.atualizarPerfil(AutenticacaoUtil.exigirUsuarioAutenticado(), request));
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@Valid @RequestBody AlterarSenhaRequest request) {
        usuarioService.alterarSenha(AutenticacaoUtil.exigirUsuarioAutenticado(), request);
        return ResponseEntity.noContent().build();
    }
}
