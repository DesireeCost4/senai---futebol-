package com.senai.futebol.repository;

import com.senai.futebol.model.ContratoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    //verifica se já existiu algum contrato entre o clube e o jogador - proibido recompra
    @Query("SELECT COUNT(c) > 0 FROM ContratoModel c WHERE c.clube.id = :clubeId AND c.jogador.id = :jogadorId")
    boolean jogadorJaPertenceuaoClube(@Param("clubeId") Integer clubeId, @Param("jogadorId") Integer jogadorId);

    // conta quantos jogadores ativos um clube possui - limite 12
    @Query("SELECT COUNT(c) FROM ContratoModel c WHERE c.clube.id = :clubeId AND c.situacao = :situacao")
    long contagemJogadoresNoTime(@Param("clubeId") Integer clubeId, @Param("situacao") String situacao);

    // busca o contrato ativo de um jogador específico (para verificar se está livre)
    @Query("SELECT c FROM ContratoModel c WHERE c.jogador.id = :jogadorId AND c.situacao = :situacao")
    Optional<ContratoModel> buscarContratoAtivoPorJogador(@Param("jogadorId") Integer jogadorId, @Param("situacao") String situacao);

}
