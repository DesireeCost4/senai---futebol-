package com.senai.futebol.repository;

import com.senai.futebol.model.EscalacoesModel;
import com.senai.futebol.model.EscalacoesModelId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EscalacaoRepository extends JpaRepository<EscalacoesModel, EscalacoesModelId> {

    List<EscalacoesModel> findByClubeId(Long clubeId);

    void deleteByClubeId(Long clubeId);
    boolean existsByJogadorId(Long jogadorId);

    List<EscalacoesModel> findByJogadorId(Long jogadorId);
}