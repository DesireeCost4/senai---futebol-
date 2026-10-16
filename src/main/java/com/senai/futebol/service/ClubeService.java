package com.senai.futebol.service;

import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.repository.ClubeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class ClubeService {

    private final ClubeRepository clubeRepository;

    public ClubeService(ClubeRepository clubeRepository) {
        this.clubeRepository = clubeRepository;
    }

    public ClubeModel salvarClube(ClubeModel clube) {
        // regra liga aceita no máximo 20 clubes
        long totalClubes = clubeRepository.count();
        if (totalClubes >= 20) {
            throw new IllegalArgumentException("A liga atingiu o limite máximo de 20 clubes.");
        }

        // regra de nome único (ignorando maiúsculas/minúsculas)
        if (clube.getNome() != null && clubeRepository.nomeCadastrado(clube.getNome())) {
            throw new IllegalArgumentException("Já existe um clube cadastrado com este nome.");
        }

        // regra de validação de sigla única
        if (clube.getSigla() != null && clubeRepository.siglaCadastrada(clube.getSigla())) {
            throw new IllegalArgumentException("Já existe um clube cadastrado com esta sigla.");
        }

        // configuração do caixa inicial e data
        clube.setCaixa(new BigDecimal("300.00"));
        if (clube.getCriadoEm() == null) {
            clube.setCriadoEm(Instant.now());
        }

        return clubeRepository.save(clube);
    }

    public List<ClubeModel> listarClubes() {
        return clubeRepository.findAll();
    }

    public ClubeModel buscarPorId(Integer id) {
        return clubeRepository.findById(id).orElse(null);
    }
}