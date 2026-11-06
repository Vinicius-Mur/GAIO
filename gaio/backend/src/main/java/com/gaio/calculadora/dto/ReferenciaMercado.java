package com.gaio.calculadora.dto;

import com.gaio.calculadora.domain.ReferenciaMercadoSalva;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * m2 dos anuncios da mesma categoria no local da estimativa (bairro ou, com pouca amostra, zona),
 * calculado pelo servico de ML. Serve para posicionar a estimativa frente ao mercado.
 */
public record ReferenciaMercado(
        @NotBlank @Size(max = 120)
        String local,

        @NotBlank @Size(max = 10)
        String fonte,

        @Size(max = 20)
        String categoria,

        @NotNull @Positive
        Integer anuncios,

        @NotNull @Positive
        Double precoM2Mediano,

        @NotNull @Positive
        Double precoM2P25,

        @NotNull @Positive
        Double precoM2P75
) {

    @AssertTrue(message = "Quartis da referência de mercado fora de ordem")
    public boolean isQuartisEmOrdem() {
        return precoM2P25 == null || precoM2Mediano == null || precoM2P75 == null
                || (precoM2P25 <= precoM2Mediano && precoM2Mediano <= precoM2P75);
    }

    public static ReferenciaMercado from(ReferenciaMercadoSalva salva) {
        if (salva == null || salva.getLocal() == null) {
            return null;
        }
        return new ReferenciaMercado(salva.getLocal(), salva.getFonte(), salva.getCategoria(), salva.getAnuncios(),
                salva.getPrecoM2Mediano(), salva.getPrecoM2P25(), salva.getPrecoM2P75());
    }

    public ReferenciaMercadoSalva toDomain() {
        return new ReferenciaMercadoSalva(local, fonte, categoria, anuncios, precoM2Mediano, precoM2P25, precoM2P75);
    }
}
