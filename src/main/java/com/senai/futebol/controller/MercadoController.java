package com.senai.futebol.controller;

import com.senai.futebol.model.TransacoesModel;
import com.senai.futebol.service.MercadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mercado")
@CrossOrigin(origins = "*")
public class MercadoController {

    private final MercadoService mercadoService;

    public MercadoController(MercadoService mercadoService) {
        this.mercadoService = mercadoService;
    }

   // /mercado/comprar/{jogadorId}?clubeId=1
    @PostMapping("/comprar/{jogadorId}")
    public ResponseEntity<Void> comprarJogador(
            @PathVariable Integer jogadorId,
            @RequestParam Integer clubeId) {
        mercadoService.comprarJogador(jogadorId, clubeId);
        return ResponseEntity.noContent().build();
    }

    //  /mercado/vender/{jogadorId}?clubeId=1
    @PostMapping("/vender/{jogadorId}")
    public ResponseEntity<Void> venderJogador(
            @PathVariable Integer jogadorId,
            @RequestParam Integer clubeId) {
        mercadoService.venderJogador(jogadorId, clubeId);
        return ResponseEntity.noContent().build();
    }


    //  /mercado/transacoes/1?tipo=COMPRA&jogadorId=5
    @GetMapping("/transacoes/{clubeId}")
    public ResponseEntity<List<TransacoesModel>> listarTransacoes(
            @PathVariable Integer clubeId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer jogadorId) {
        
        List<TransacoesModel> transacoes = mercadoService.encontrarTransacoesFiltradas(clubeId, tipo, jogadorId);
        return ResponseEntity.ok(transacoes);
    }
}