package com.gaio.calculadora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AtualizarPerfilRequest(

        @NotBlank(message = "Informe o nome")
        String nome,

        @NotBlank(message = "Informe o email")
        @Email(message = "Email inválido")
        String email
) {
}
