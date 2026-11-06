package com.gaio.calculadora.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "estimativas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Estimativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bairroOuCep;

    @Column(nullable = false)
    private Double areaM2;

    @Column(nullable = false)
    private Integer quartos;

    @Column(nullable = false)
    private Integer banheiros;

    @Column(nullable = false)
    private Integer vagasGaragem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaImovel categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoImovel tipo;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Zona zona;

    @Column(nullable = false)
    private Double condominio;

    @Embedded
    private Amenidades amenidades;

    @Embedded
    private ReferenciaMercadoSalva referenciaMercado;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal valorEstimado;

    @Column(precision = 14, scale = 2)
    private BigDecimal faixaMinima;

    @Column(precision = 14, scale = 2)
    private BigDecimal faixaMaxima;

    private Double confianca;

    @Column(nullable = false)
    private Instant criadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    // Insights exibidos ao usuario no momento do calculo; gravados para poderem ser exportados depois.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "estimativa_insights", joinColumns = @JoinColumn(name = "estimativa_id"))
    @OrderColumn(name = "posicao")
    @Column(name = "texto", nullable = false, length = 1000)
    @Builder.Default
    private List<String> insightsMercado = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (criadoEm == null) {
            criadoEm = Instant.now();
        }
    }
}
