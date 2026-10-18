package com.senai.futebol.controller;

import com.senai.futebol.model.PartidaModel;
import com.senai.futebol.repository.PartidaRepository;
import com.senai.futebol.service.LigaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class LigaController {

    @Autowired
    private LigaService ligaService;

    @Autowired
    private PartidaRepository partidaRepository;

    @PutMapping("/clubs/{id}/lineup")
    public ResponseEntity<Map<String, Object>> atualizarEscalacao(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String formation = (String) body.get("formation");

        //refatoração: houve um problema com relação a tipagem integer e long
        List<?> rawIds = (List<?>) body.get("player_ids");
        List<Long> playerIds = rawIds.stream()
                .map(obj -> ((Number) obj).longValue())
                .toList();

        Map<String, Object> resp = ligaService.salvarEscalacao(id, formation, playerIds);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/clubs/{id}/lineup")
    public ResponseEntity<Map<String, Object>> consultarEscalacao(@PathVariable Long id) {
        Map<String, Object> resp = ligaService.consultarEscalacao(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/matches")
    public ResponseEntity<PartidaModel> jogarPartida(@RequestBody Map<String, Long> body) {
        Long homeId = body.get("home_club_id");
        Long awayId = body.get("away_club_id");
        PartidaModel partida = ligaService.jogarPartida(homeId, awayId);
        return ResponseEntity.created(URI.create("/api/v1/matches/" + partida.getId())).body(partida);
    }

    @GetMapping("/matches")
    public ResponseEntity<List<PartidaModel>> listarPartidas(@RequestParam(required = false) Long club_id) {
        List<PartidaModel> partidas = partidaRepository.findByClubeIdOrAll(club_id);
        return ResponseEntity.ok(partidas);
    }

    @GetMapping("/matches/{id}")
    public ResponseEntity<PartidaModel> buscarPartida(@PathVariable Long id) {
        PartidaModel p = partidaRepository.findById(id)
                .orElseThrow(() -> new com.senai.futebol.exception.RecursoNotFoundException("Partida não encontrada"));

        return ResponseEntity.ok(p);
    }

    @GetMapping("/standings")
    public ResponseEntity<List<Map<String, Object>>> classificados() {
        List<Map<String, Object>> standing = ligaService.calcularClassificacao();
        return ResponseEntity.ok(standing);
    }
}