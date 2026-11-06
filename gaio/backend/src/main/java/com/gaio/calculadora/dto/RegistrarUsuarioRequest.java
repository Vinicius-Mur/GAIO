package com.gaio.calculadora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrarUsuarioRequest(

        @NotBlank(message = "Informe o nome")
        String nome,

        @NotBlank(message = "Informe o email")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "Informe a senha")
        @Size(min = 6, message = "A senha deve ter ao menos 6 caracteres")
        String senha
) {
}
