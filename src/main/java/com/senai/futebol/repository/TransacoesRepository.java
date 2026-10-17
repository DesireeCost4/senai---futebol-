package com.senai.futebol.repository;

import com.senai.futebol.model.TransacoesModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransacoesRepository extends JpaRepository<TransacoesModel, Integer> {

    @Query("SELECT t FROM TransacoesModel t WHERE t.clube.id = :clubeId " +
            "AND (:tipo IS NULL OR t.tipo = :tipo) " +
            "AND (:jogadorId IS NULL OR t.jogador.id = :jogadorId) " +
            "ORDER BY t.criadoEm DESC, t.id DESC")
    List<TransacoesModel> encontrarTransacoesFiltradas(
            @Param("clubeId") Integer clubeId,
            @Param("tipo") String tipo,
            @Param("jogadorId") Integer jogadorId
    );

}