package com.senai.futebol.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "escalacoes")
public class EscalacoesModel {
    @EmbeddedId
    private EscalacoesModelId id;

    @MapsId("clubeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_id", nullable = false)
    private ClubeModel clube;

    @MapsId("jogadorId")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false)
    private JogadorModel jogador;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    public EscalacoesModelId getId() {
        return id;
    }

    public void setId(EscalacoesModelId id) {
        this.id = id;
    }

    public ClubeModel getClube() {
        return clube;
    }

    public void setClube(ClubeModel clube) {
        this.clube = clube;
    }

    public JogadorModel getJogador() {
        return jogador;
    }

    public void setJogador(JogadorModel jogador) {
        this.jogador = jogador;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Instant criadoEm) {
        this.criadoEm = criadoEm;
    }

}