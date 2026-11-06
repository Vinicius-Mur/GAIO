package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.AlterarSenhaRequest;
import com.gaio.calculadora.dto.AtualizarPerfilRequest;
import com.gaio.calculadora.dto.TokenResponse;
import com.gaio.calculadora.dto.UsuarioResponse;
import com.gaio.calculadora.exception.EmailJaCadastradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          AuthService authService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    public UsuarioResponse perfil(Usuario usuarioLogado) {
        return UsuarioResponse.from(usuarioLogado);
    }

    // Devolve um token novo: o token identifica o usuario pelo email, entao trocar o email invalida o anterior.
    public TokenResponse atualizarPerfil(Usuario usuarioLogado, AtualizarPerfilRequest request) {
        boolean emailMudou = !request.email().equalsIgnoreCase(usuarioLogado.getEmail());
        if (emailMudou && usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException(request.email());
        }

        usuarioLogado.setNome(request.nome());
        usuarioLogado.setEmail(request.email());
        Usuario salvo = usuarioRepository.save(usuarioLogado);
        return authService.gerarResposta(salvo);
    }

    public void alterarSenha(Usuario usuarioLogado, AlterarSenhaRequest request) {
        if (!passwordEncoder.matches(request.senhaAtual(), usuarioLogado.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        if (passwordEncoder.matches(request.novaSenha(), usuarioLogado.getSenhaHash())) {
            throw new RegraNegocioException("A nova senha deve ser diferente da atual.");
        }

        usuarioLogado.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuarioRepository.save(usuarioLogado);
    }
}
