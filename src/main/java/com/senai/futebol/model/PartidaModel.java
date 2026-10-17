package com.senai.futebol.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "partidas")
public class PartidaModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mandante_id", nullable = false)
    private ClubeModel mandante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitante_id", nullable = false)
    private ClubeModel visitante;

    @Column(name = "gols_mandante", nullable = false)
    private Integer golsMandante;

    @Column(name = "gols_visitante", nullable = false)
    private Integer golsVisitante;

    @Column(name = "formacao_mandante", nullable = false, length = 5)
    private String formacaoMandante;

    @Column(name = "formacao_visitante", nullable = false, length = 5)
    private String formacaoVisitante;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "jogada_em", nullable = false)
    private Instant jogadaEm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ClubeModel getMandante() {
        return mandante;
    }

    public void setMandante(ClubeModel mandante) {
        this.mandante = mandante;
    }

    public ClubeModel getVisitante() {
        return visitante;
    }

    public void setVisitante(ClubeModel visitante) {
        this.visitante = visitante;
    }

    public Integer getGolsMandante() {
        return golsMandante;
    }

    public void setGolsMandante(Integer golsMandante) {
        this.golsMandante = golsMandante;
    }

    public Integer getGolsVisitante() {
        return golsVisitante;
    }

    public void setGolsVisitante(Integer golsVisitante) {
        this.golsVisitante = golsVisitante;
    }

    public String getFormacaoMandante() {
        return formacaoMandante;
    }

    public void setFormacaoMandante(String formacaoMandante) {
        this.formacaoMandante = formacaoMandante;
    }

    public String getFormacaoVisitante() {
        return formacaoVisitante;
    }

    public void setFormacaoVisitante(String formacaoVisitante) {
        this.formacaoVisitante = formacaoVisitante;
    }

    public Instant getJogadaEm() {
        return jogadaEm;
    }

    public void setJogadaEm(Instant jogadaEm) {
        this.jogadaEm = jogadaEm;
    }

}