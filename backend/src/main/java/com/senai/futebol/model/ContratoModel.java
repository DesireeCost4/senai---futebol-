package com.senai.futebol.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "contratos")
public class ContratoModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jogador_id", nullable = false)
    private JogadorModel jogador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clube_id", nullable = false)
    private ClubeModel clube;

    @Column(name = "valor_compra", nullable = false, precision = 6, scale = 2)
    private BigDecimal valorCompra;

    @Column(name = "fidelidade_ate", nullable = false)
    private Instant fidelidadeAte;

    @ColumnDefault("'ATIVO'")
    @Column(name = "situacao", nullable = false, length = 12)
    private String situacao;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "iniciado_em", nullable = false)
    private Instant iniciadoEm;

    @Column(name = "encerrado_em")
    private Instant encerradoEm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public JogadorModel getJogador() {
        return jogador;
    }

    public void setJogador(JogadorModel jogador) {
        this.jogador = jogador;
    }

    public ClubeModel getClube() {
        return clube;
    }

    public void setClube(ClubeModel clube) {
        this.clube = clube;
    }

    public BigDecimal getValorCompra() {
        return valorCompra;
    }

    public void setValorCompra(BigDecimal valorCompra) {
        this.valorCompra = valorCompra;
    }

    public Instant getFidelidadeAte() {
        return fidelidadeAte;
    }

    public void setFidelidadeAte(Instant fidelidadeAte) {
        this.fidelidadeAte = fidelidadeAte;
    }

    public String getSituacao() {
        return situacao;
    }

    public void setSituacao(String situacao) {
        this.situacao = situacao;
    }

    public Instant getIniciadoEm() {
        return iniciadoEm;
    }

    public void setIniciadoEm(Instant iniciadoEm) {
        this.iniciadoEm = iniciadoEm;
    }

    public Instant getEncerradoEm() {
        return encerradoEm;
    }

    public void setEncerradoEm(Instant encerradoEm) {
        this.encerradoEm = encerradoEm;
    }

}
