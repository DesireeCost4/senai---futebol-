package com.senai.futebol.repository;

import com.senai.futebol.model.EscalacoesModel;
import com.senai.futebol.model.EscalacoesModelId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EscalacaoRepository extends JpaRepository<EscalacoesModel, EscalacoesModelId> {

    List<EscalacoesModel> findByClubeId(Long clubeId);

    List<EscalacoesModel> findByClubeId(Integer clubeId);

    @Modifying
    @Transactional
    void deleteByClubeId(Long clubeId);

    @Modifying
    @Transactional
    void deleteByClubeId(Integer clubeId);

    boolean existsByJogadorId(Long jogadorId);

    List<EscalacoesModel> findByJogadorId(Long jogadorId);

    @Modifying
    @Transactional
    @Query("DELETE FROM EscalacoesModel e WHERE e.jogador.id = :jogadorId")
    void deleteByJogadorId(@Param("jogadorId") Long jogadorId);

    @Modifying
    @Transactional
    @Query("DELETE FROM EscalacoesModel e WHERE e.jogador.id = :jogadorId")
    void deleteByJogadorId(@Param("jogadorId") Integer jogadorId);
}
