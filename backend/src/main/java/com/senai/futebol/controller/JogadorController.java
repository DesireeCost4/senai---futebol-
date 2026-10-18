package com.senai.futebol.controller;

import com.senai.futebol.dto.*;
import com.senai.futebol.service.JogadorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/players")
@CrossOrigin(origins = "${cors.origins:http://localhost:5173,http://localhost:3000}")
public class JogadorController {

    private final JogadorService jogadorService;

    public JogadorController(JogadorService jogadorService) {
        this.jogadorService = jogadorService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponseDTO<JogadorResponseDTO>> listarJogadores(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Boolean free,
            @RequestParam(name = "club_id", required = false) Integer clubId,
            @RequestParam(name = "min_age", required = false) Integer minAge,
            @RequestParam(name = "max_age", required = false) Integer maxAge,
            @RequestParam(name = "min_value", required = false) BigDecimal minValue,
            @RequestParam(name = "max_value", required = false) BigDecimal maxValue,
            @RequestParam(required = false, defaultValue = "name") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        PaginatedResponseDTO<JogadorResponseDTO> resultado = jogadorService.listarComFiltrosAvancados(
                search, position, condition, free, clubId, minAge, maxAge, minValue, maxValue, sort, page, limit
        );

        return ResponseEntity.ok(resultado);
    }

    @PostMapping
    public ResponseEntity<JogadorResponseDTO> cadastrarJogador(@RequestBody JogadorRequestDTO jogadorDto) {
        JogadorResponseDTO novoJogador = jogadorService.cadastrar(jogadorDto);
        URI location = URI.create("/api/v1/players/" + novoJogador.getId());
        return ResponseEntity.created(location).body(novoJogador);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JogadorResponseDTO> buscarPorId(@PathVariable Integer id) {
        JogadorResponseDTO jogador = jogadorService.buscarDtoPorId(id);
        return ResponseEntity.ok(jogador);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JogadorResponseDTO> atualizar(
            @PathVariable Integer id,
            @RequestBody JogadorUpdateRequestDTO dadosAtualizados) {

        JogadorResponseDTO atualizado = jogadorService.atualizar(id, dadosAtualizados);
        return ResponseEntity.ok(atualizado);
    }

    @PatchMapping("/{id}/condition")
    public ResponseEntity<JogadorResponseDTO> alterarCondicao(
            @PathVariable Integer id,
            @RequestBody JogadorConditionRequestDTO body) {

        JogadorResponseDTO atualizado = jogadorService.alterarCondicaoDto(id, body != null ? body.getCondition() : null);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        jogadorService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}