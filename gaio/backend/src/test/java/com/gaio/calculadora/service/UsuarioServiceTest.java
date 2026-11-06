package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.AlterarSenhaRequest;
import com.gaio.calculadora.dto.AtualizarPerfilRequest;
import com.gaio.calculadora.dto.TokenResponse;
import com.gaio.calculadora.exception.EmailJaCadastradoException;
import com.gaio.calculadora.exception.RegraNegocioException;
import com.gaio.calculadora.repository.UsuarioRepository;
import com.gaio.calculadora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService("chave-de-teste-com-tamanho-suficiente-para-hmac-sha-256-ok", 3_600_000);
    private UsuarioService usuarioService;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        AuthService authService = new AuthService(usuarioRepository, passwordEncoder, jwtService);
        usuarioService = new UsuarioService(usuarioRepository, passwordEncoder, authService);
        usuario = Usuario.builder().id(1L).nome("Ana").email("ana@teste.com")
                .senhaHash(passwordEncoder.encode("senha-atual")).build();
    }

    @Test
    void atualizarPerfilMantendoEmailNaoConsultaDuplicidade() {
        when(usuarioRepository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        TokenResponse resposta = usuarioService.atualizarPerfil(usuario, new AtualizarPerfilRequest("Ana Souza", "ana@teste.com"));

        assertThat(resposta.usuario().nome()).isEqualTo("Ana Souza");
        verify(usuarioRepository, never()).existsByEmail(any());
    }

    @Test
    void trocarEmailDevolveTokenNovoQueIdentificaONovoEmail() {
        when(usuarioRepository.existsByEmail("nova@teste.com")).thenReturn(false);
        when(usuarioRepository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        TokenResponse resposta = usuarioService.atualizarPerfil(usuario, new AtualizarPerfilRequest("Ana", "nova@teste.com"));

        assertThat(resposta.usuario().email()).isEqualTo("nova@teste.com");
        assertThat(jwtService.extrairEmail(resposta.token())).isEqualTo("nova@teste.com");
    }

    @Test
    void trocarParaEmailDeOutraContaDeveSerBloqueado() {
        when(usuarioRepository.existsByEmail("outra@teste.com")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.atualizarPerfil(usuario, new AtualizarPerfilRequest("Ana", "outra@teste.com")))
                .isInstanceOf(EmailJaCadastradoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void alterarSenhaComSenhaAtualCorretaGravaNovoHash() {
        usuarioService.alterarSenha(usuario, new AlterarSenhaRequest("senha-atual", "senha-nova"));

        assertThat(passwordEncoder.matches("senha-nova", usuario.getSenhaHash())).isTrue();
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void alterarSenhaComSenhaAtualErradaDeveSerBloqueado() {
        assertThatThrownBy(() -> usuarioService.alterarSenha(usuario, new AlterarSenhaRequest("errada", "senha-nova")))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("Senha atual incorreta");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void novaSenhaIgualAAtualDeveSerBloqueada() {
        assertThatThrownBy(() -> usuarioService.alterarSenha(usuario, new AlterarSenhaRequest("senha-atual", "senha-atual")))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("diferente");
    }
}
