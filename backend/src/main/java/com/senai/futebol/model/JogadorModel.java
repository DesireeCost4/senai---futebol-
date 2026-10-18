package com.senai.futebol.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "jogadores")
public class JogadorModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "posicao", nullable = false, length = 3)
    private String posicao;

    @Column(name = "agilidade", nullable = false)
    private Integer agilidade;

    @Column(name = "idade", nullable = false)
    private Integer idade;

    @Column(name = "valor_base", nullable = false, precision = 6, scale = 2)
    private BigDecimal valorBase;

    @Column(name = "condicao", nullable = false, length = 20)
    private String condicao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clube_id")
    private ClubeModel clube;

    @Column(name = "velocidade", nullable = false)
    private Integer velocidade;

    @Column(name = "finalizacao", nullable = false)
    private Integer finalizacao;

    @Column(name = "passe", nullable = false)
    private Integer passe;

    @Column(name = "drible", nullable = false)
    private Integer drible;

    @Column(name = "defesa", nullable = false)
    private Integer defesa;

    @Column(name = "fisico", nullable = false)
    private Integer fisico;

    @Column(name = "potencial", nullable = false)
    private Integer potencial;

    @Column(name = "excluido_em")
    private Instant excluidoEm;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getPosicao() {
        return posicao;
    }

    public void setPosicao(String posicao) {
        this.posicao = posicao;
    }

    public Integer getAgilidade() {
        return agilidade;
    }

    public void setAgilidade(Integer agilidade) {
        this.agilidade = agilidade;
    }

    public Integer getIdade() {
        return idade;
    }

    public void setIdade(Integer idade) {
        this.idade = idade;
    }

    public BigDecimal getValorBase() {
        return valorBase;
    }

    public void setValorBase(BigDecimal valorBase) {
        this.valorBase = valorBase;
    }

    public String getCondicao() {
        return condicao;
    }

    public void setCondicao(String condicao) {
        this.condicao = condicao;
    }

    public Integer getVelocidade() {
        return velocidade;
    }

    public void setVelocidade(Integer velocidade) {
        this.velocidade = velocidade;
    }

    public Integer getFinalizacao() {
        return finalizacao;
    }

    public void setFinalizacao(Integer finalizacao) {
        this.finalizacao = finalizacao;
    }

    public Integer getPasse() {
        return passe;
    }

    public void setPasse(Integer passe) {
        this.passe = passe;
    }

    public Integer getDrible() {
        return drible;
    }

    public void setDrible(Integer drible) {
        this.drible = drible;
    }

    public Integer getDefesa() {
        return defesa;
    }

    public void setDefesa(Integer defesa) {
        this.defesa = defesa;
    }

    public Integer getFisico() {
        return fisico;
    }

    public void setFisico(Integer fisico) {
        this.fisico = fisico;
    }

    public Integer getPotencial() {
        return potencial;
    }

    public void setPotencial(Integer potencial) {
        this.potencial = potencial;
    }

    public Instant getExcluidoEm() {
        return excluidoEm;
    }

    public void setExcluidoEm(Instant excluidoEm) {
        this.excluidoEm = excluidoEm;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Instant criadoEm) {
        this.criadoEm = criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(Instant atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

    public ClubeModel getClube() {
        return clube;
    }

    public void setClube(ClubeModel clube) {
        this.clube = clube;
    }
}