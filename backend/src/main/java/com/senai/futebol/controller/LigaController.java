package com.senai.futebol.controller;

import com.senai.futebol.dto.LineupRequestDTO;
import com.senai.futebol.dto.LineupResponseDTO;
import com.senai.futebol.dto.MatchRequestDTO;
import com.senai.futebol.dto.PartidaResponseDTO;
import com.senai.futebol.service.LigaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "${cors.origins:http://localhost:5173,http://localhost:3000}")
public class LigaController {

    @Autowired
    private LigaService ligaService;

    @PutMapping("/clubs/{id}/lineup")
    public ResponseEntity<LineupResponseDTO> atualizarEscalacao(
            @PathVariable Integer id,
            @RequestBody LineupRequestDTO body) {
        LineupResponseDTO resp = ligaService.atualizarEscalacao(id, body);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/clubs/{id}/lineup")
    public ResponseEntity<LineupResponseDTO> consultarEscalacao(@PathVariable Integer id) {
        LineupResponseDTO resp = ligaService.consultarEscalacaoDto(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/matches")
    public ResponseEntity<PartidaResponseDTO> jogarPartida(@RequestBody MatchRequestDTO body) {
        PartidaResponseDTO partida = ligaService.jogarPartidaDto(body);
        URI location = URI.create("/api/v1/matches/" + partida.getId());
        return ResponseEntity.created(location).body(partida);
    }

    @GetMapping("/matches")
    public ResponseEntity<List<PartidaResponseDTO>> listarPartidas(
            @RequestParam(name = "club_id", required = false) Integer clubId) {
        List<PartidaResponseDTO> partidas = ligaService.listarPartidasDto(clubId);
        return ResponseEntity.ok(partidas);
    }

    @GetMapping("/matches/{id}")
    public ResponseEntity<PartidaResponseDTO> buscarPartida(@PathVariable Integer id) {
        PartidaResponseDTO p = ligaService.buscarPartidaDto(id);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/standings")
    public ResponseEntity<List<Map<String, Object>>> classificados() {
        List<Map<String, Object>> standing = ligaService.calcularClassificacao();
        return ResponseEntity.ok(standing);
    }
}
