package com.senai.futebol.repository;

import com.senai.futebol.model.JogadorModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JogadorRepository extends JpaRepository<JogadorModel, Integer> {

    Optional<JogadorModel> findByIdAndExcluidoEmIsNull(Integer id);

    List<JogadorModel> findByExcluidoEmIsNull();

    List<JogadorModel> findByClubeIdAndExcluidoEmIsNull(Integer clubeId);

    @Query("SELECT j FROM JogadorModel j WHERE j.excluidoEm IS NULL " +
            "AND (:search IS NULL OR LOWER(j.nome) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:posicao IS NULL OR j.posicao = :posicao) " +
            "AND (:condicao IS NULL OR j.condicao = :condicao)")
    Page<JogadorModel> filtrarJogadores(
            @Param("search") String search,
            @Param("posicao") String posicao,
            @Param("condicao") String condicao,
            Pageable pageable
    );
}
