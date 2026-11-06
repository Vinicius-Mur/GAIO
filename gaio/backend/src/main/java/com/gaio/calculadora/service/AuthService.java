package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.LoginRequest;
import com.gaio.calculadora.dto.RegistrarUsuarioRequest;
import com.gaio.calculadora.dto.TokenResponse;
import com.gaio.calculadora.dto.UsuarioResponse;
import com.gaio.calculadora.exception.CredenciaisInvalidasException;
import com.gaio.calculadora.exception.EmailJaCadastradoException;
import com.gaio.calculadora.repository.UsuarioRepository;
import com.gaio.calculadora.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public TokenResponse registrar(RegistrarUsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException(request.email());
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .build();

        usuario = usuarioRepository.save(usuario);
        return gerarResposta(usuario);
    }

    public TokenResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(CredenciaisInvalidasException::new);

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }

        return gerarResposta(usuario);
    }

    TokenResponse gerarResposta(Usuario usuario) {
        String token = jwtService.gerarToken(usuario);
        return TokenResponse.of(token, jwtService.expiracaoMs(), UsuarioResponse.from(usuario));
    }
}
