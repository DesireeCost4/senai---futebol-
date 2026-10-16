package com.senai.futebol.controller;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.service.JogadorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/players")
public class JogadorController {

    private final JogadorService jogadorService;

    public JogadorController(JogadorService jogadorService) {
        this.jogadorService = jogadorService;
    }

    @GetMapping

    //refatoração para cumprimento de regra de filtro em buscas
    public ResponseEntity<Map<String, Object>> listarJogadores(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String posicao,
            @RequestParam(required = false) String condicao,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "id") String sortBy) {

        Pageable pageable = PageRequest.of(page, limit, Sort.by(sortBy));
        Page<JogadorModel> paginaJogadores = jogadorService.listarComFiltros(search, posicao, condicao, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("data", paginaJogadores.getContent());

        Map<String, Object> meta = new HashMap<>();
        meta.put("page", paginaJogadores.getNumber());
        meta.put("limit", paginaJogadores.getSize());
        meta.put("total_items", paginaJogadores.getTotalElements());
        meta.put("total_pages", paginaJogadores.getTotalPages());
        response.put("meta", meta);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<JogadorModel> cadastrarJogador(@RequestBody JogadorModel jogador) {
        // Refatoração adição de tratamento de erro

        try {
            JogadorModel novoJogador = jogadorService.salvarJogador(jogador);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoJogador);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<JogadorModel> buscarPorId(@PathVariable Integer id) {
        JogadorModel jogador = jogadorService.buscarPoId(id);
        if (jogador == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(jogador);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id){
        boolean sucesso = jogadorService.excluirJogador(id);
        if (!sucesso) {
            return ResponseEntity.notFound().build();
        }

        //garante o retorno 204 conforme regra 09
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<JogadorModel> atualizar(
            @PathVariable Integer id,
            @RequestBody JogadorModel dadosAtualizados) {

        //refatoração adicação de tratamento de erro
        try {
            JogadorModel atualizado = jogadorService.atualizarJogador(id, dadosAtualizados);
            if (atualizado == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PatchMapping("/{id}/condicao")
    public ResponseEntity<JogadorModel> alterarCondicao(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, String> body) {

        try {
            String novaCondicao = body.get("condicao");
            JogadorModel atualizado = jogadorService.alterarCondicao(id, novaCondicao);
            if (atualizado == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

}