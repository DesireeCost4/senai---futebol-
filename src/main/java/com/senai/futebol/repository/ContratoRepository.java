package com.senai.futebol.repository;

import org.springframework.stereotype.Repository;

@Repository
public interface ContratoRepository {

    boolean jogadorJaPertenceuaoClube(Integer clubeId, Integer jogadorId);
}
