package com.senai.futebol.controller;

import com.senai.futebol.dto.ClubeRequestDTO;
import com.senai.futebol.dto.ClubeResponseDTO;
import com.senai.futebol.service.ClubeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clubs")
@CrossOrigin(origins = "${cors.origins:http://localhost:5173,http://localhost:3000}")
public class ClubeController {

    private final ClubeService clubeService;

    public ClubeController(ClubeService clubeService) {
        this.clubeService = clubeService;
    }

    @PostMapping
    public ResponseEntity<ClubeResponseDTO> cadastrarClube(@RequestBody ClubeRequestDTO clubeDto) {
        ClubeResponseDTO novoClube = clubeService.cadastrar(clubeDto);
        URI location = URI.create("/api/v1/clubs/" + novoClube.getId());
        return ResponseEntity.created(location).body(novoClube);
    }

    @GetMapping
    public ResponseEntity<List<ClubeResponseDTO>> listarClubes(
            @RequestParam(required = false, defaultValue = "name") String sort) {
        List<ClubeResponseDTO> clubes = clubeService.listarClubesDto(sort);
        return ResponseEntity.ok(clubes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubeResponseDTO> buscarPorId(@PathVariable Integer id) {
        ClubeResponseDTO clube = clubeService.buscarDtoPorId(id);
        return ResponseEntity.ok(clube);
    }
}
