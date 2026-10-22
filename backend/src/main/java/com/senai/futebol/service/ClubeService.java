package com.senai.futebol.service;

import com.senai.futebol.dto.ClubeRequestDTO;
import com.senai.futebol.dto.ClubeResponseDTO;
import com.senai.futebol.dto.ContratoInfoDTO;
import com.senai.futebol.dto.JogadorComContratoResponseDTO;
import com.senai.futebol.exception.NegocioException;
import com.senai.futebol.exception.RecursoNotFoundException;
import com.senai.futebol.exception.ValidacaoException;
import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.model.ContratoModel;
import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.ClubeRepository;
import com.senai.futebol.repository.ContratoRepository;
import com.senai.futebol.repository.JogadorRepository;
import com.senai.futebol.util.DataUtils;
import com.senai.futebol.util.TextoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClubeService {

    private final ClubeRepository clubeRepository;

    @Autowired(required = false)
    private ContratoRepository contratoRepository;

    @Autowired(required = false)
    private JogadorRepository jogadorRepository;

    @Autowired(required = false)
    private JogadorService jogadorService;

    public ClubeService(ClubeRepository clubeRepository) {
        this(clubeRepository, null, null, null);
    }

    @Autowired
    public ClubeService(ClubeRepository clubeRepository,
                        @Autowired(required = false) ContratoRepository contratoRepository,
                        @Autowired(required = false) JogadorRepository jogadorRepository,
                        @Autowired(required = false) JogadorService jogadorService) {
        this.clubeRepository = clubeRepository;
        this.contratoRepository = contratoRepository;
        this.jogadorRepository = jogadorRepository;
        this.jogadorService = jogadorService;
    }

    @Transactional
    public ClubeResponseDTO cadastrar(ClubeRequestDTO dto) {
        if (dto.getName() == null || !TextoUtils.validarNomeClube(dto.getName())) {
            throw new ValidacaoException("Nome do clube inválido. Deve ter entre 3 e 60 caracteres, de 2 a 5 palavras e conter apenas letras, espaços, hífen e ponto.");
        }

        String nomeLimpo = TextoUtils.limparEspacos(dto.getName());
        String sigla = dto.getAcronym() != null ? dto.getAcronym().trim() : null;

        if (sigla == null || !TextoUtils.validarSiglaClube(sigla, nomeLimpo)) {
            throw new ValidacaoException("Sigla inválida. Deve conter exatamente 3 letras maiúsculas presentes no nome do clube nessa ordem, começando com a primeira letra do nome, e não podem ser todas iguais.");
        }

        long totalClubes = clubeRepository.count();
        if (totalClubes >= 20) {
            throw new NegocioException("A liga atingiu o limite máximo de 20 clubes.");
        }

        List<ClubeModel> todos = clubeRepository.findAll();
        for (ClubeModel c : todos) {
            if (c.getNome().equalsIgnoreCase(nomeLimpo)) {
                throw new NegocioException("Já existe um clube cadastrado com este nome.");
            }
            if (c.getSigla().equalsIgnoreCase(sigla)) {
                throw new NegocioException("Já existe um clube cadastrado com esta sigla.");
            }
        }

        ClubeModel clube = new ClubeModel();
        clube.setNome(nomeLimpo);
        clube.setSigla(sigla);
        clube.setCaixa(new BigDecimal("300.00"));
        clube.setCriadoEm(Instant.now());

        ClubeModel salvo = clubeRepository.save(clube);

        ClubeResponseDTO resp = new ClubeResponseDTO();
        resp.setId(salvo.getId());
        resp.setName(salvo.getNome());
        resp.setAcronym(salvo.getSigla());
        resp.setCash(salvo.getCaixa().setScale(2, RoundingMode.HALF_UP));
        resp.setSquadValue(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        resp.setNetWorth(salvo.getCaixa().setScale(2, RoundingMode.HALF_UP));
        return resp;
    }

    public ClubeModel salvarClube(ClubeModel clube) {
        long totalClubes = clubeRepository.count();
        if (totalClubes >= 20) {
            throw new IllegalArgumentException("A liga atingiu o limite máximo de 20 clubes.");
        }

        if (clube.getNome() != null && clubeRepository.nomeCadastrado(clube.getNome())) {
            throw new IllegalArgumentException("Já existe um clube cadastrado com este nome.");
        }

        if (clube.getSigla() != null && clubeRepository.siglaCadastrada(clube.getSigla())) {
            throw new IllegalArgumentException("Já existe um clube cadastrado com esta sigla.");
        }

        clube.setCaixa(new BigDecimal("300.00"));
        if (clube.getCriadoEm() == null) {
            clube.setCriadoEm(Instant.now());
        }

        return clubeRepository.save(clube);
    }

    public List<ClubeResponseDTO> listarClubesDto(String sort) {
        List<ClubeModel> clubes = clubeRepository.findAll();
        List<ClubeResponseDTO> dtos = new ArrayList<>();

        for (ClubeModel c : clubes) {
            dtos.add(montarResumoClube(c));
        }

        // Ordenação
        Comparator<ClubeResponseDTO> base = Comparator
                .comparing((ClubeResponseDTO c) -> TextoUtils.normalizar(c.getName()))
                .thenComparing(ClubeResponseDTO::getId);

        if ("net_worth_asc".equalsIgnoreCase(sort)) {
            dtos.sort(Comparator.comparing(ClubeResponseDTO::getNetWorth).thenComparing(base));
        } else if ("net_worth_desc".equalsIgnoreCase(sort)) {
            dtos.sort(Comparator.comparing(ClubeResponseDTO::getNetWorth).reversed().thenComparing(base));
        } else {
            dtos.sort(base);
        }

        return dtos;
    }

    public List<ClubeModel> listarClubes() {
        return clubeRepository.findAll();
    }

    public ClubeModel buscarPorId(Integer id) {
        return clubeRepository.findById(id).orElse(null);
    }

    public ClubeResponseDTO buscarDtoPorId(Integer id) {
        ClubeModel clube = clubeRepository.findById(id)
                .orElseThrow(() -> new RecursoNotFoundException("Clube não encontrado."));

        ClubeResponseDTO dto = montarResumoClube(clube);

        // Preenche o elenco de jogadores com seus contratos
        List<JogadorComContratoResponseDTO> players = obterElencoComContratos(id);
        dto.setPlayers(players);

        // Atualiza squad_value e net_worth com base no elenco real
        BigDecimal squadValue = players.stream()
                .map(JogadorComContratoResponseDTO::getMarketValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        dto.setSquadValue(squadValue);
        dto.setNetWorth(clube.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP));

        return dto;
    }

    private ClubeResponseDTO montarResumoClube(ClubeModel c) {
        ClubeResponseDTO dto = new ClubeResponseDTO();
        dto.setId(c.getId());
        dto.setName(c.getNome());
        dto.setAcronym(c.getSigla());
        dto.setCash(c.getCaixa().setScale(2, RoundingMode.HALF_UP));

        List<JogadorComContratoResponseDTO> players = obterElencoComContratos(c.getId());
        BigDecimal squadValue = players.stream()
                .map(JogadorComContratoResponseDTO::getMarketValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        dto.setSquadValue(squadValue);
        dto.setNetWorth(c.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP));
        return dto;
    }

    public List<JogadorComContratoResponseDTO> obterElencoComContratos(Integer clubeId) {
        if (jogadorRepository == null || contratoRepository == null || jogadorService == null) {
            return Collections.emptyList();
        }

        List<JogadorModel> jogadoresDoClube = jogadorRepository.findByClubeIdAndExcluidoEmIsNull(clubeId);
        Instant agora = Instant.now();

        List<JogadorComContratoResponseDTO> resultado = new ArrayList<>();

        for (JogadorModel j : jogadoresDoClube) {
            JogadorComContratoResponseDTO pDto = new JogadorComContratoResponseDTO();
            pDto.setId(j.getId());
            pDto.setName(j.getNome());
            pDto.setPosition(j.getPosicao());
            pDto.setAgility(j.getAgilidade());
            pDto.setAge(j.getIdade());
            pDto.setCondition(j.getCondicao());
            pDto.setBaseValue(j.getValorBase());
            pDto.setMarketValue(jogadorService.calcularValorDeMercado(j));
            pDto.setPace(j.getVelocidade());
            pDto.setShooting(j.getFinalizacao());
            pDto.setPassing(j.getPasse());
            pDto.setDribbling(j.getDrible());
            pDto.setDefending(j.getDefesa());
            pDto.setPhysical(j.getFisico());
            pDto.setPotential(j.getPotencial());
            pDto.setOverall(jogadorService.calcularOverall(j));
            pDto.setClubId(clubeId);

            Optional<ContratoModel> contratoOpt = contratoRepository.buscarContratoAtivoPorJogador(j.getId(), "ATIVO");
            if (contratoOpt.isPresent()) {
                ContratoModel c = contratoOpt.get();
                long diasRestantes = calcularDiasRestantes(agora, c.getFidelidadeAte());
                int penaltyRate = calcularPercentualMulta(diasRestantes);

                ContratoInfoDTO cInfo = new ContratoInfoDTO(
                        c.getValorCompra().setScale(2, RoundingMode.HALF_UP),
                        DataUtils.formatarBrasilia(c.getFidelidadeAte()),
                        diasRestantes,
                        penaltyRate
                );
                pDto.setContract(cInfo);
            }

            resultado.add(pDto);
        }

        // RN11: ordenado por posição na ordem GOL, ZAG, LAT, MEI, ATA, depois pelo nome e depois pelo id
        resultado.sort(Comparator
                .comparing((JogadorComContratoResponseDTO p) -> prioridadePosicao(p.getPosition()))
                .thenComparing(p -> TextoUtils.normalizar(p.getName()))
                .thenComparing(JogadorComContratoResponseDTO::getId)
        );

        return resultado;
    }

    public static long calcularDiasRestantes(Instant agora, Instant fimFidelidade) {
        if (fimFidelidade == null || fimFidelidade.isBefore(agora) || fimFidelidade.equals(agora)) {
            return 0L;
        }
        Duration d = Duration.between(agora, fimFidelidade);
        long segundos = d.getSeconds();
        if (segundos <= 0) return 0L;
        // Qualquer fração de dia arredonda para cima
        return (segundos + 86399L) / 86400L;
    }

    public static int calcularPercentualMulta(long diasRestantes) {
        if (diasRestantes <= 0) return 0;
        if (diasRestantes <= 30) return 5;
        if (diasRestantes <= 180) return 10;
        return 20;
    }

    private int prioridadePosicao(String pos) {
        if (pos == null) return 99;
        return switch (pos.toUpperCase()) {
            case "GOL" -> 1;
            case "ZAG" -> 2;
            case "LAT" -> 3;
            case "MEI" -> 4;
            case "ATA" -> 5;
            default -> 99;
        };
    }
}
