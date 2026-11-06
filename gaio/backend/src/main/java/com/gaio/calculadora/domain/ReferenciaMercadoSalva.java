package com.gaio.calculadora.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Referencia de mercado gravada com a estimativa, para o dashboard comparar sem consultar o
 * servico de ML de novo e sem mudar quando a base de anuncios for atualizada.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReferenciaMercadoSalva {

    @Column(name = "ref_local", length = 120)
    private String local;

    @Column(name = "ref_fonte", length = 10)
    private String fonte;

    @Column(name = "ref_categoria", length = 20)
    private String categoria;

    @Column(name = "ref_anuncios")
    private Integer anuncios;

    @Column(name = "ref_preco_m2_mediano")
    private Double precoM2Mediano;

    @Column(name = "ref_preco_m2_p25")
    private Double precoM2P25;

    @Column(name = "ref_preco_m2_p75")
    private Double precoM2P75;
}
