package com.senai.futebol.repository;

import com.senai.futebol.model.ClubeModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubeRepository extends JpaRepository<ClubeModel, Integer> {

    @Query("SELECT COUNT(c) > 0 FROM ClubeModel c WHERE LOWER(c.nome) = LOWER(:nome)")
    boolean nomeCadastrado(@Param("nome") String nome);

    @Query("SELECT COUNT(c) > 0 FROM ClubeModel c WHERE LOWER(c.sigla) = LOWER(:sigla)")
    boolean siglaCadastrada(@Param("sigla") String sigla);

    Optional<ClubeModel> findByNome(String nome);
}