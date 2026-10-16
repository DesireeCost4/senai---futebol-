package com.senai.futebol.controller;

import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.service.ClubeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clubs")
public class ClubeController {

    private final ClubeService clubeService;

    public ClubeController(ClubeService clubeService) {
        this.clubeService = clubeService;
    }

    @PostMapping
    public ResponseEntity<?> cadastrarClube(@RequestBody ClubeModel clube) {
        try {
            ClubeModel novoClube = clubeService.salvarClube(clube);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoClube);
        } catch (IllegalArgumentException e) {
            // regras de negócio quebradas retornam 409
            return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ClubeModel>> listarClubes() {
        List<ClubeModel> clubes = clubeService.listarClubes();
        return ResponseEntity.ok(clubes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubeModel> buscarPorId(@PathVariable Integer id) {
        ClubeModel clube = clubeService.buscarPorId(id);
        if (clube == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(clube);
    }
}