package com.senai.futebol.repository;

import com.senai.futebol.model.DuelosPartidaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DuelosPartidaRepository extends JpaRepository<DuelosPartidaModel, Integer> {
    List<DuelosPartidaModel> findByPartidaIdOrderByOrdemAsc(Integer partidaId);
}
