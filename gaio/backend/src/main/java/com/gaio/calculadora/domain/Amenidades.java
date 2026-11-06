package com.gaio.calculadora.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenidades {

    @Column(nullable = false)
    private boolean academia;

    @Column(nullable = false)
    private boolean elevador;

    @Column(nullable = false)
    private boolean permitidoAnimais;

    @Column(nullable = false)
    private boolean piscina;

    @Column(nullable = false)
    private boolean portaria;

    @Column(nullable = false)
    private boolean salaoFestas;

    @Column(nullable = false)
    private boolean condominioFechado;

    @Column(name = "seguranca_24h", nullable = false)
    private boolean seguranca24h;

    @Column(nullable = false)
    private boolean portaoEletronico;

    @Column(nullable = false)
    private boolean areaMurada;

    @Column(nullable = false)
    private boolean areaServico;

    @Column(nullable = false)
    private boolean armariosCozinha;

    @Column(nullable = false)
    private boolean armariosQuarto;

    @Column(nullable = false)
    private boolean churrasqueira;

    @Column(nullable = false)
    private boolean mobiliado;

    @Column(nullable = false)
    private boolean quartoServico;

    @Column(nullable = false)
    private boolean arCondicionado;

    @Column(name = "porteiro_24h", nullable = false)
    private boolean porteiro24h;

    @Column(nullable = false)
    private boolean varanda;
}
