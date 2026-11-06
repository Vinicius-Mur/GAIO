package com.gaio.calculadora.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "anuncios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estimativa_id", nullable = false, unique = true)
    private Estimativa estimativa;

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private String enderecoCompleto;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnuncioStatus status;

    @Column(nullable = false)
    private boolean publicado;

    @Column(nullable = false)
    private Instant criadoEm;

    @Column(nullable = false)
    private Instant atualizadoEm;

    @PrePersist
    void prePersist() {
        Instant agora = Instant.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        atualizadoEm = agora;
        if (status == null) {
            status = AnuncioStatus.RASCUNHO;
        }
    }

    @PreUpdate
    void preUpdate() {
        atualizadoEm = Instant.now();
    }
}
