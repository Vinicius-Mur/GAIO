package com.gaio.calculadora.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> mensagens = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getField() + ": " + erro.getDefaultMessage())
                .toList();

        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Dados inválidos", mensagens));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleCorpoInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Dados inválidos",
                        List.of(descreverCorpoInvalido(ex))));
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiErrorResponse.of(HttpStatus.NOT_FOUND.value(), "Recurso não encontrado", List.of(ex.getMessage())));
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleExternalService(ExternalServiceException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiErrorResponse.of(HttpStatus.BAD_GATEWAY.value(), "Servico externo indisponivel", List.of(ex.getMessage())));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiErrorResponse> handleRegraNegocio(RegraNegocioException ex) {
        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Regra de negócio violada", List.of(ex.getMessage())));
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailJaCadastrado(EmailJaCadastradoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.of(HttpStatus.CONFLICT.value(), "Email já cadastrado", List.of(ex.getMessage())));
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ApiErrorResponse> handleCredenciaisInvalidas(CredenciaisInvalidasException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiErrorResponse.of(HttpStatus.UNAUTHORIZED.value(), "Não autorizado", List.of(ex.getMessage())));
    }

    private String descreverCorpoInvalido(HttpMessageNotReadableException ex) {
        Throwable causa = ex.getCause();
        while (causa != null && !(causa instanceof MismatchedInputException)) {
            causa = causa.getCause();
        }
        if (!(causa instanceof MismatchedInputException erro)) {
            return "Corpo da requisição inválido ou mal formatado";
        }

        String campo = erro.getPath().stream()
                .map(JacksonException.Reference::getPropertyName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("."));
        String prefixo = campo.isEmpty() ? "" : campo + ": ";

        Class<?> tipo = erro.getTargetType();
        if (tipo != null && tipo.isEnum()) {
            return prefixo + "valor inválido, use um de " + Arrays.toString(tipo.getEnumConstants());
        }
        return prefixo + "valor em formato inválido";
    }
}
