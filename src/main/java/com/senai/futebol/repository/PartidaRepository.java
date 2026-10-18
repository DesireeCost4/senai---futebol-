package com.senai.futebol.repository;

import com.senai.futebol.model.PartidaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PartidaRepository extends JpaRepository<PartidaModel, Long> {

    @Query("SELECT p FROM PartidaModel p WHERE :clubId IS NULL OR p.mandante.id = :clubId OR p.visitante.id = :clubId ORDER BY p.jogadaEm DESC, p.id DESC")
    List<PartidaModel> findByClubeIdOrAll(@Param("clubId") Long clubId);



}