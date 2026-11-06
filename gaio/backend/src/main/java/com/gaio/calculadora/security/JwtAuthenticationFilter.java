package com.gaio.calculadora.security;

import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String cabecalho = request.getHeader("Authorization");

        if (cabecalho != null && cabecalho.startsWith(PREFIXO_BEARER)) {
            String token = cabecalho.substring(PREFIXO_BEARER.length());

            if (jwtService.tokenValido(token)) {
                String email = jwtService.extrairEmail(token);
                Optional<Usuario> usuario = usuarioRepository.findByEmail(email);

                if (usuario.isPresent() && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken autenticacao = new UsernamePasswordAuthenticationToken(
                            usuario.get(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(autenticacao);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
