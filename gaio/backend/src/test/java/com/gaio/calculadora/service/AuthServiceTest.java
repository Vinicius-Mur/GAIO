package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.Usuario;
import com.gaio.calculadora.dto.LoginRequest;
import com.gaio.calculadora.dto.RegistrarUsuarioRequest;
import com.gaio.calculadora.dto.TokenResponse;
import com.gaio.calculadora.exception.CredenciaisInvalidasException;
import com.gaio.calculadora.exception.EmailJaCadastradoException;
import com.gaio.calculadora.repository.UsuarioRepository;
import com.gaio.calculadora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtService);
    }

    @Test
    void registrarComEmailJaExistenteDeveLancarExcecao() {
        when(usuarioRepository.existsByEmail("ja@existe.com")).thenReturn(true);

        RegistrarUsuarioRequest request = new RegistrarUsuarioRequest("Nome", "ja@existe.com", "senha123");

        assertThatThrownBy(() -> authService.registrar(request))
                .isInstanceOf(EmailJaCadastradoException.class);
    }

    @Test
    void registrarComSucessoDeveGerarSenhaHashEToken() {
        when(usuarioRepository.existsByEmail("novo@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("hash-fake");
        when(usuarioRepository.save(any())).thenAnswer(chamada -> {
            Usuario u = chamada.getArgument(0);
            u.setId(1L);
            u.setCriadoEm(Instant.now());
            return u;
        });
        when(jwtService.gerarToken(any())).thenReturn("token-fake");
        when(jwtService.expiracaoMs()).thenReturn(86400000L);

        RegistrarUsuarioRequest request = new RegistrarUsuarioRequest("Nome", "novo@teste.com", "senha123");

        TokenResponse resposta = authService.registrar(request);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getSenhaHash()).isEqualTo("hash-fake");
        assertThat(resposta.token()).isEqualTo("token-fake");
        assertThat(resposta.usuario().email()).isEqualTo("novo@teste.com");
    }

    @Test
    void loginComEmailInexistenteDeveLancarCredenciaisInvalidas() {
        when(usuarioRepository.findByEmail("naoexiste@teste.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("naoexiste@teste.com", "qualquer");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }

    @Test
    void loginComSenhaErradaDeveLancarCredenciaisInvalidas() {
        Usuario usuario = Usuario.builder().id(1L).nome("Nome").email("e@teste.com").senhaHash("hash").build();
        when(usuarioRepository.findByEmail("e@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        LoginRequest request = new LoginRequest("e@teste.com", "senhaerrada");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }

    @Test
    void loginComCredenciaisCorretasDeveRetornarToken() {
        Usuario usuario = Usuario.builder().id(1L).nome("Nome").email("e@teste.com").senhaHash("hash").build();
        when(usuarioRepository.findByEmail("e@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha123", "hash")).thenReturn(true);
        when(jwtService.gerarToken(usuario)).thenReturn("token-fake");
        when(jwtService.expiracaoMs()).thenReturn(86400000L);

        TokenResponse resposta = authService.login(new LoginRequest("e@teste.com", "senha123"));

        assertThat(resposta.token()).isEqualTo("token-fake");
    }
}
