package com.senai.futebol.controller;

import com.senai.futebol.dto.CompraRequestDTO;
import com.senai.futebol.dto.CompraResponseDTO;
import com.senai.futebol.dto.HistoricoTransacoesResponseDTO;
import com.senai.futebol.dto.VendaResponseDTO;
import com.senai.futebol.service.MercadoService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "${cors.origins:http://localhost:5173,http://localhost:3000}")
public class MercadoController {

    private final MercadoService mercadoService;

    public MercadoController(MercadoService mercadoService) {
        this.mercadoService = mercadoService;
    }

    @PostMapping("/players/{id}/buy")
    public ResponseEntity<CompraResponseDTO> comprar(
            @PathVariable Integer id,
            @RequestBody CompraRequestDTO request) {
        CompraResponseDTO resp = mercadoService.comprar(id, request);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/players/{id}/sell")
    public ResponseEntity<VendaResponseDTO> vender(@PathVariable Integer id) {
        VendaResponseDTO resp = mercadoService.vender(id);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/clubs/{id}/transactions")
    public ResponseEntity<HistoricoTransacoesResponseDTO> listarTransacoes(
            @PathVariable Integer id,
            @RequestParam(required = false) String type,
            @RequestParam(name = "player_id", required = false) Integer playerId) {

        HistoricoTransacoesResponseDTO resp = mercadoService.listarHistorico(id, type, playerId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping(value = "/clubs/{id}/transactions/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportarHistoricoCsv(
            @PathVariable Integer id,
            @RequestParam(required = false) String type,
            @RequestParam(name = "player_id", required = false) Integer playerId) {

        byte[] csv = mercadoService.exportarCsv(id, type, playerId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=utf-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transacoes_clube_" + id + ".csv\"")
                .body(csv);
    }
}