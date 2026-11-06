package com.gaio.calculadora.security;

import com.gaio.calculadora.domain.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class AutenticacaoUtil {

    private AutenticacaoUtil() {
    }

    public static Optional<Usuario> usuarioAutenticado() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();

        if (autenticacao == null || !autenticacao.isAuthenticated()
                || !(autenticacao.getPrincipal() instanceof Usuario usuario)) {
            return Optional.empty();
        }

        return Optional.of(usuario);
    }

    public static Usuario exigirUsuarioAutenticado() {
        return usuarioAutenticado()
                .orElseThrow(() -> new IllegalStateException("Nenhum usuario autenticado no contexto"));
    }
}
