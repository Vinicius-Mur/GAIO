package com.gaio.calculadora.dto;

public record EnderecoDetalhadoResponse(
        String enderecoFormatado,
        String logradouro,
        String bairro,
        String cidade,
        String uf,
        String cep,
        Double latitude,
        Double longitude
) {
}
