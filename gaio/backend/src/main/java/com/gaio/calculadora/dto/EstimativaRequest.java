package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.TipoImovel;
import com.gaio.calculadora.domain.Zona;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record EstimativaRequest(

        @NotBlank(message = "Informe o bairro ou CEP do imóvel")
        String bairroOuCep,

        @NotNull(message = "Informe a área do imóvel")
        @Positive(message = "A área deve ser maior que zero")
        @Max(value = 5000, message = "Área acima do limite suportado")
        Double areaM2,

        @NotNull(message = "Informe o número de quartos")
        @Min(value = 1, message = "Mínimo de 1 quarto")
        Integer quartos,

        @NotNull(message = "Informe o número de banheiros")
        @Min(value = 0, message = "Número de banheiros inválido")
        Integer banheiros,

        @NotNull(message = "Informe o número de vagas de garagem")
        @Min(value = 0, message = "Número de vagas inválido")
        Integer vagasGaragem,

        @NotNull(message = "Informe a categoria do imóvel")
        CategoriaImovel categoria,

        @NotNull(message = "Informe o tipo do imóvel")
        TipoImovel tipo,

        Zona zona,

        @NotNull(message = "Informe o valor do condomínio")
        @PositiveOrZero(message = "O valor do condomínio não pode ser negativo")
        Double condominio,

        @NotNull(message = "Informe as amenidades do imóvel")
        @Valid
        Amenidades amenidades,

        String descricaoOpcional
) {
}
