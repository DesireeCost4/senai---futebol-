package com.senai.futebol.controller;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.service.JogadorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/players")
public class JogadorController {

    private final JogadorService jogadorService;

    public JogadorController(JogadorService jogadorService) {
        this.jogadorService = jogadorService;
    }

    @GetMapping
    public ResponseEntity<List<JogadorModel>> listarJogadores() {
        List<JogadorModel> jogadores = jogadorService.listarTodosJogadores();
        return ResponseEntity.ok(jogadores);
    }

    @PostMapping
    public ResponseEntity<JogadorModel> cadastrarJogador(@RequestBody JogadorModel jogador) {
        JogadorModel novoJogador = jogadorService.salvarJogador(jogador);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoJogador);
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

        //aqui garante o retorno 204 conforme regra 09
        return ResponseEntity.noContent().build();
    }


}