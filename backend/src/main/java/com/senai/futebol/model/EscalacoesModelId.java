package com.senai.futebol.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class EscalacoesModelId implements Serializable {
    @Serial
    private static final long serialVersionUID = 1284302657219278817L;
    @Column(name = "clube_id", nullable = false)
    private Integer clubeId;

    @Column(name = "jogador_id", nullable = false)
    private Integer jogadorId;

    public Integer getClubeId() {
        return clubeId;
    }

    public void setClubeId(Integer clubeId) {
        this.clubeId = clubeId;
    }

    public Integer getJogadorId() {
        return jogadorId;
    }

    public void setJogadorId(Integer jogadorId) {
        this.jogadorId = jogadorId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EscalacoesModelId entity = (EscalacoesModelId) o;
        return Objects.equals(this.clubeId, entity.clubeId) &&
                Objects.equals(this.jogadorId, entity.jogadorId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(clubeId, jogadorId);
    }
}
