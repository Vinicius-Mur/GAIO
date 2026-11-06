package com.gaio.calculadora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(

        @NotBlank(message = "Informe a senha atual")
        String senhaAtual,

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 6, message = "A senha deve ter ao menos 6 caracteres")
        String novaSenha
) {
}
