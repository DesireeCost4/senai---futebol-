package com.senai.futebol.service;

import com.senai.futebol.dto.*;
import com.senai.futebol.exception.NegocioException;
import com.senai.futebol.exception.RecursoNotFoundException;
import com.senai.futebol.exception.ValidacaoException;
import com.senai.futebol.model.*;
import com.senai.futebol.repository.*;
import com.senai.futebol.util.DataUtils;
import com.senai.futebol.util.TextoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LigaService {

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private ClubeRepository clubeRepository;

    @Autowired
    private JogadorRepository jogadorRepository;

    @Autowired
    private EscalacaoRepository escalacaoRepository;

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired(required = false)
    private DuelosPartidaRepository duelosPartidaRepository;

    @Autowired(required = false)
    private JogadorService jogadorService;

    private static final List<String> FORMATIONS_VALIDAS = List.of("3-1", "2-2", "2-1-1", "1-2-1");

    @Transactional
    public LineupResponseDTO atualizarEscalacao(Integer clubeId, LineupRequestDTO dto) {
        if (dto == null || dto.getFormation() == null || !FORMATIONS_VALIDAS.contains(dto.getFormation())) {
            throw new ValidacaoException("Formação inválida. Aceitas: 3-1, 2-2, 2-1-1 ou 1-2-1.");
        }

        List<Integer> playerIds = dto.getPlayerIds();
        if (playerIds == null || playerIds.size() != 5 || new HashSet<>(playerIds).size() != 5) {
            throw new ValidacaoException("player_ids deve conter exatamente 5 IDs distintos.");
        }

        for (Integer pid : playerIds) {
            if (pid == null || pid <= 0) {
                throw new ValidacaoException("Cada ID em player_ids deve ser um inteiro positivo.");
            }
        }

        ClubeModel clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new RecursoNotFoundException("Clube não encontrado."));

        List<JogadorModel> jogadores = jogadorRepository.findAllById(playerIds);
        if (jogadores.size() != 5) {
            throw new RecursoNotFoundException("Um ou mais jogadores não existem.");
        }

        for (JogadorModel j : jogadores) {
            if (j.getExcluidoEm() != null) {
                throw new RecursoNotFoundException("Jogador excluído não pode ser escalado: " + j.getId());
            }
            // RN19: Cada titular precisa ser do elenco do clube
            Optional<ContratoModel> cOpt = contratoRepository.buscarContratoAtivoPorJogador(j.getId(), "ATIVO");
            if (cOpt.isEmpty() || !cOpt.get().getClube().getId().equals(clubeId)) {
                throw new NegocioException("Jogador " + j.getNome() + " não pertence ao elenco ativo deste clube.");
            }
            if ("DOENTE".equalsIgnoreCase(j.getCondicao())) {
                throw new NegocioException("Jogador DOENTE não pode ser escalado: " + j.getNome());
            }
        }

        long goleiros = 0, defesa = 0, meio = 0, ataque = 0;
        for (JogadorModel j : jogadores) {
            String pos = j.getPosicao().toUpperCase();
            switch (pos) {
                case "GOL" -> goleiros++;
                case "ZAG", "LAT" -> defesa++;
                case "MEI" -> meio++;
                case "ATA" -> ataque++;
            }
        }

        if (goleiros != 1) {
            throw new NegocioException("A escalação precisa ter exatamente 1 goleiro (GOL).");
        }

        validarSetoresFormacao(dto.getFormation(), defesa, meio, ataque);

        // Substitui a escalação inteira
        escalacaoRepository.deleteByClubeId(clubeId.longValue());
        clube.setFormacao(dto.getFormation());
        clubeRepository.save(clube);

        for (Integer pid : playerIds) {
            JogadorModel jogador = jogadorRepository.findById(pid).orElseThrow();
            EscalacoesModelId idComposto = new EscalacoesModelId();
            idComposto.setClubeId(clubeId);
            idComposto.setJogadorId(pid);

            EscalacoesModel esc = new EscalacoesModel();
            esc.setId(idComposto);
            esc.setClube(clube);
            esc.setJogador(jogador);
            escalacaoRepository.save(esc);
        }

        return consultarEscalacaoDto(clubeId);
    }

    public LineupResponseDTO consultarEscalacaoDto(Integer clubeId) {
        ClubeModel clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new RecursoNotFoundException("Clube não encontrado."));

        List<EscalacoesModel> escs = escalacaoRepository.findByClubeId(clubeId.longValue());

        List<JogadorModel> jogadores = escs.stream()
                .map(EscalacoesModel::getJogador)
                .filter(j -> j.getExcluidoEm() == null)
                .collect(Collectors.toCollection(ArrayList::new));

        // Ordena na ordem da RN11
        jogadores.sort(Comparator
                .comparing((JogadorModel j) -> prioridadePosicao(j.getPosicao()))
                .thenComparing(j -> TextoUtils.normalizar(j.getNome()))
                .thenComparing(JogadorModel::getId));

        List<JogadorResponseDTO> playersDto = new ArrayList<>();
        for (JogadorModel j : jogadores) {
            if (jogadorService != null) {
                playersDto.add(jogadorService.converterParaDto(j));
            } else {
                JogadorResponseDTO d = new JogadorResponseDTO();
                d.setId(j.getId());
                d.setName(j.getNome());
                d.setPosition(j.getPosicao());
                d.setCondition(j.getCondicao());
                d.setDefending(j.getDefesa());
                playersDto.add(d);
            }
        }

        boolean complete = clube.getFormacao() != null && playersDto.size() == 5;

        return new LineupResponseDTO(
                clube.getId(),
                clube.getFormacao(),
                complete,
                playersDto);
    }

    @Transactional
    public PartidaResponseDTO jogarPartidaDto(MatchRequestDTO dto) {
        if (dto == null || dto.getHomeClubId() == null || dto.getAwayClubId() == null) {
            throw new ValidacaoException("home_club_id e away_club_id são obrigatórios.");
        }
        if (dto.getHomeClubId() <= 0 || dto.getAwayClubId() <= 0) {
            throw new ValidacaoException("IDs dos clubes devem ser inteiros positivos.");
        }
        if (Objects.equals(dto.getHomeClubId(), dto.getAwayClubId())) {
            throw new ValidacaoException("Mandante e visitante não podem ser o mesmo clube.");
        }

        ClubeModel mandante = clubeRepository.findById(dto.getHomeClubId())
                .orElseThrow(() -> new RecursoNotFoundException("Clube mandante não encontrado."));
        ClubeModel visitante = clubeRepository.findById(dto.getAwayClubId())
                .orElseThrow(() -> new RecursoNotFoundException("Clube visitante não encontrado."));

        LineupResponseDTO homeLineup = consultarEscalacaoDto(dto.getHomeClubId());
        LineupResponseDTO awayLineup = consultarEscalacaoDto(dto.getAwayClubId());

        if (!Boolean.TRUE.equals(homeLineup.getComplete()) || !Boolean.TRUE.equals(awayLineup.getComplete())) {
            throw new NegocioException("Um ou ambos os clubes não possuem escalação completa (5 titulares).");
        }

        List<JogadorResponseDTO> homeTitulares = homeLineup.getPlayers();
        List<JogadorResponseDTO> awayTitulares = awayLineup.getPlayers();

        Instant playedAt = Instant.now();
        List<DuelosPartidaModel> duelosModels = new ArrayList<>();
        List<DueloResponseDTO> duelosDtos = new ArrayList<>();

        int golsHome = 0;
        int golsAway = 0;

        // Duelos 1 a 3: Mandante ataca
        for (int i = 1; i <= 3; i++) {
            DueloSimulado sim = simularDuelo(i, mandante.getId(), homeTitulares, visitante.getId(), awayTitulares);
            if (sim.gol)
                golsHome++;
            duelosModels.add(sim.model);
            duelosDtos.add(sim.dto);
        }

        // Duelos 4 a 6: Visitante ataca
        for (int i = 4; i <= 6; i++) {
            DueloSimulado sim = simularDuelo(i, visitante.getId(), awayTitulares, mandante.getId(), homeTitulares);
            if (sim.gol)
                golsAway++;
            duelosModels.add(sim.model);
            duelosDtos.add(sim.dto);
        }

        PartidaModel partida = new PartidaModel();
        partida.setMandante(mandante);
        partida.setVisitante(visitante);
        partida.setGolsMandante(golsHome);
        partida.setGolsVisitante(golsAway);
        partida.setFormacaoMandante(homeLineup.getFormation());
        partida.setFormacaoVisitante(awayLineup.getFormation());
        partida.setJogadaEm(playedAt);

        PartidaModel partidaSalva = partidaRepository.save(partida);

        // Salvar os 6 duelos no banco de dados
        for (DuelosPartidaModel d : duelosModels) {
            d.setPartida(partidaSalva);
        }
        if (duelosPartidaRepository != null) {
            duelosPartidaRepository.saveAll(duelosModels);
        }

        String resultado;
        if (golsHome > golsAway) {
            resultado = "MANDANTE";
        } else if (golsAway > golsHome) {
            resultado = "VISITANTE";
        } else {
            resultado = "EMPATE";
        }

        PartidaResponseDTO resp = new PartidaResponseDTO();
        resp.setId(partidaSalva.getId());
        resp.setPlayedAt(DataUtils.formatarBrasilia(playedAt));
        resp.setHome(
                new PartidaClubResumoDTO(mandante.getId(), mandante.getNome(), homeLineup.getFormation(), golsHome));
        resp.setAway(
                new PartidaClubResumoDTO(visitante.getId(), visitante.getNome(), awayLineup.getFormation(), golsAway));
        resp.setResult(resultado);
        resp.setDuels(duelosDtos);

        return resp;
    }

    public List<PartidaResponseDTO> listarPartidasDto(Integer clubId) {
        List<PartidaModel> partidas = partidaRepository.findByClubeIdOrAll(clubId != null ? clubId.longValue() : null);

        List<PartidaResponseDTO> lista = new ArrayList<>();
        for (PartidaModel p : partidas) {
            PartidaResponseDTO dto = new PartidaResponseDTO();
            dto.setId(p.getId());
            dto.setPlayedAt(DataUtils.formatarBrasilia(p.getJogadaEm()));
            dto.setHome(new PartidaClubResumoDTO(p.getMandante().getId(), p.getMandante().getNome(),
                    p.getFormacaoMandante(), p.getGolsMandante()));
            dto.setAway(new PartidaClubResumoDTO(p.getVisitante().getId(), p.getVisitante().getNome(),
                    p.getFormacaoVisitante(), p.getGolsVisitante()));

            String res;
            if (p.getGolsMandante() > p.getGolsVisitante())
                res = "MANDANTE";
            else if (p.getGolsVisitante() > p.getGolsMandante())
                res = "VISITANTE";
            else
                res = "EMPATE";

            dto.setResult(res);
            lista.add(dto);
        }
        return lista;
    }

    public PartidaResponseDTO buscarPartidaDto(Integer id) {
        PartidaModel p = partidaRepository.findById(id.longValue())
                .orElseThrow(() -> new RecursoNotFoundException("Partida não encontrada."));

        PartidaResponseDTO dto = new PartidaResponseDTO();
        dto.setId(p.getId());
        dto.setPlayedAt(DataUtils.formatarBrasilia(p.getJogadaEm()));
        dto.setHome(new PartidaClubResumoDTO(p.getMandante().getId(), p.getMandante().getNome(),
                p.getFormacaoMandante(), p.getGolsMandante()));
        dto.setAway(new PartidaClubResumoDTO(p.getVisitante().getId(), p.getVisitante().getNome(),
                p.getFormacaoVisitante(), p.getGolsVisitante()));

        String res;
        if (p.getGolsMandante() > p.getGolsVisitante())
            res = "MANDANTE";
        else if (p.getGolsVisitante() > p.getGolsMandante())
            res = "VISITANTE";
        else
            res = "EMPATE";
        dto.setResult(res);

        if (duelosPartidaRepository != null) {
            List<DuelosPartidaModel> duelos = duelosPartidaRepository.findByPartidaIdOrderByOrdemAsc(p.getId());
            List<DueloResponseDTO> dDtos = duelos.stream().map(d -> new DueloResponseDTO(
                    d.getOrdem(),
                    d.getClubeAtacante().getId(),
                    new DuelPlayerDTO(d.getAtacante().getId(), d.getNomeAtacante(), d.getPosicaoAtacante(),
                            d.getCondicaoAtacante(), d.getAtributoAtaque(), d.getValorAtaque()),
                    new DuelPlayerDTO(d.getDefensor().getId(), d.getNomeDefensor(), d.getPosicaoDefensor(),
                            d.getCondicaoDefensor(), d.getAtributoDefesa(), d.getValorDefesa()),
                    d.getGol())).collect(Collectors.toList());
            dto.setDuels(dDtos);
        }

        return dto;
    }

    private static class DueloSimulado {
        boolean gol;
        DuelosPartidaModel model;
        DueloResponseDTO dto;

        DueloSimulado(boolean gol, DuelosPartidaModel model, DueloResponseDTO dto) {
            this.gol = gol;
            this.model = model;
            this.dto = dto;
        }
    }

    private DueloSimulado simularDuelo(int ordem, Integer atacanteClubId, List<JogadorResponseDTO> atacantesList,
            Integer defensorClubId, List<JogadorResponseDTO> defensoresList) {
        JogadorResponseDTO atk;
        JogadorResponseDTO def;

        if (ordem == 1 || ordem == 4) {
            atk = atacantesList.get(4); // 4º de linha (o mais avançado)
            def = defensoresList.get(0); // Goleiro
        } else if (ordem == 2 || ordem == 5) {
            atk = atacantesList.get(3); // 3º de linha
            def = defensoresList.get(1); // 1º de linha (o mais recuado)
        } else {
            atk = atacantesList.get(2); // 2º de linha
            def = defensoresList.get(2); // 2º de linha
        }

        String atkAttr = getAtributoAtacante(atk.getPosition());
        int atkVal = getValorAtributoDto(atk, atkAttr);
        int defVal = getValorAtributoDto(def, "defending");

        boolean gol = atkVal > defVal;

        DuelosPartidaModel m = new DuelosPartidaModel();
        m.setOrdem(ordem);
        m.setClubeAtacante(clubeRepository.findById(atacanteClubId).orElseThrow());
        m.setAtacante(jogadorRepository.findById(atk.getId()).orElseThrow());
        m.setDefensor(jogadorRepository.findById(def.getId()).orElseThrow());
        m.setNomeAtacante(atk.getName());
        m.setNomeDefensor(def.getName());
        m.setPosicaoAtacante(atk.getPosition());
        m.setPosicaoDefensor(def.getPosition());
        m.setCondicaoAtacante(atk.getCondition());
        m.setCondicaoDefensor(def.getCondition());
        m.setAtributoAtaque(atkAttr);
        m.setAtributoDefesa("defending");
        m.setValorAtaque(atkVal);
        m.setValorDefesa(defVal);
        m.setGol(gol);

        DueloResponseDTO dDto = new DueloResponseDTO(
                ordem,
                atacanteClubId,
                new DuelPlayerDTO(atk.getId(), atk.getName(), atk.getPosition(), atk.getCondition(), atkAttr, atkVal),
                new DuelPlayerDTO(def.getId(), def.getName(), def.getPosition(), def.getCondition(), "defending",
                        defVal),
                gol);

        return new DueloSimulado(gol, m, dDto);
    }

    private int getValorAtributoDto(JogadorResponseDTO j, String atributo) {
        int base = switch (atributo) {
            case "shooting" -> j.getShooting() != null ? j.getShooting() : 0;
            case "passing" -> j.getPassing() != null ? j.getPassing() : 0;
            case "dribbling" -> j.getDribbling() != null ? j.getDribbling() : 0;
            case "defending" -> j.getDefending() != null ? j.getDefending() : 0;
            default -> 0;
        };

        if ("MAL_CONDICIONADO".equalsIgnoreCase(j.getCondition())) {
            double calc = base * 0.85;
            return (int) Math.round(calc);
        }
        return base;
    }

    // Métodos legados mantidos para compatibilidade com os testes unitários
    // existentes
    @Transactional
    public Map<String, Object> salvarEscalacao(Long clubeId, String formation, List<Long> playerIds) {
        ClubeModel clube = clubeRepository.findById(clubeId.intValue())
                .orElseThrow(() -> new RuntimeException("Clube não encontrado"));

        if (!FORMATIONS_VALIDAS.contains(formation)) {
            throw new IllegalArgumentException("Formação inválida");
        }

        if (playerIds == null || playerIds.size() != 5 || new HashSet<>(playerIds).size() != 5) {
            throw new IllegalArgumentException("A escalação precisa ter exatamente 5 IDs distintos");
        }

        List<JogadorModel> jogadores = jogadorRepository.findAllById(playerIds.stream().map(Long::intValue).toList());
        if (jogadores.size() != 5) {
            throw new RuntimeException("Um ou mais jogadores não existem");
        }

        long goleiros = 0, defesa = 0, meio = 0, ataque = 0;

        for (JogadorModel jogador : jogadores) {
            boolean pertenceAoClube = contratoRepository.jogadorJaPertenceuaoClube(clubeId.intValue(), jogador.getId());
            if (!pertenceAoClube || jogador.getExcluidoEm() != null) {
                throw new IllegalStateException("Jogador não pertence ao elenco do clube ou está excluído");
            }
            if ("DOENTE".equalsIgnoreCase(jogador.getCondicao())) {
                throw new IllegalStateException("Jogador doente não pode ser escalado");
            }

            if ("GOL".equalsIgnoreCase(jogador.getPosicao()))
                goleiros++;
            else if ("ZAG".equalsIgnoreCase(jogador.getPosicao()) || "LAT".equalsIgnoreCase(jogador.getPosicao()))
                defesa++;
            else if ("MEI".equalsIgnoreCase(jogador.getPosicao()))
                meio++;
            else if ("ATA".equalsIgnoreCase(jogador.getPosicao()))
                ataque++;
        }

        if (goleiros != 1) {
            throw new IllegalStateException("A escalação deve ter exatamente 1 goleiro");
        }

        validarSetoresFormacao(formation, defesa, meio, ataque);

        escalacaoRepository.deleteByClubeId(clubeId);
        clube.setFormacao(formation);
        clubeRepository.save(clube);

        for (Long pId : playerIds) {
            JogadorModel jogador = jogadorRepository.findById(pId.intValue()).orElseThrow();
            EscalacoesModelId idComposto = new EscalacoesModelId();
            idComposto.setClubeId(clubeId.intValue());
            idComposto.setJogadorId(pId.intValue());

            EscalacoesModel esc = new EscalacoesModel();
            esc.setId(idComposto);
            esc.setClube(clube);
            esc.setJogador(jogador);
            escalacaoRepository.save(esc);
        }

        return consultarEscalacao(clubeId);
    }

    private void validarSetoresFormacao(String formation, long defesa, long meio, long ataque) {
        boolean valido = switch (formation) {
            case "3-1" -> defesa == 3 && meio == 0 && ataque == 1;
            case "2-2" -> defesa == 2 && meio == 0 && ataque == 2;
            case "2-1-1" -> defesa == 2 && meio == 1 && ataque == 1;
            case "1-2-1" -> defesa == 1 && meio == 2 && ataque == 1;
            default -> false;
        };
        if (!valido) {
            throw new IllegalStateException("As posições dos jogadores não fecham com a formação escolhida");
        }
    }

    public Map<String, Object> consultarEscalacao(Long clubeId) {
        ClubeModel clube = clubeRepository.findById(clubeId.intValue())
                .orElseThrow(() -> new RuntimeException("Clube não encontrado"));

        List<EscalacoesModel> escs = escalacaoRepository.findByClubeId(clubeId);

        List<JogadorModel> jogadores = escs.stream()
                .map(EscalacoesModel::getJogador)
                .collect(Collectors.toCollection(ArrayList::new));

        jogadores.sort(Comparator
                .comparing((JogadorModel j) -> prioridadePosicao(j.getPosicao()))
                .thenComparing(j -> TextoUtils.normalizar(j.getNome()))
                .thenComparing(JogadorModel::getId));

        boolean complete = clube.getFormacao() != null && jogadores.size() == 5;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("club_id", clube.getId());
        resp.put("formation", clube.getFormacao());
        resp.put("complete", complete);
        resp.put("players", jogadores);
        return resp;
    }

    private int prioridadePosicao(String pos) {
        if (pos == null)
            return 99;
        return switch (pos.toUpperCase()) {
            case "GOL" -> 1;
            case "ZAG" -> 2;
            case "LAT" -> 3;
            case "MEI" -> 4;
            case "ATA" -> 5;
            default -> 99;
        };
    }

    @Transactional
    public PartidaModel jogarPartida(Long homeClubId, Long awayClubId) {
        if (Objects.equals(homeClubId, awayClubId)) {
            throw new IllegalArgumentException("Mandante e visitante não podem ser o mesmo clube");
        }

        ClubeModel mandanteClube = clubeRepository.findById(homeClubId.intValue()).orElseThrow();
        ClubeModel visitanteClube = clubeRepository.findById(awayClubId.intValue()).orElseThrow();

        Map<String, Object> homeLineup = consultarEscalacao(homeClubId);
        Map<String, Object> awayLineup = consultarEscalacao(awayClubId);

        if (!(Boolean) homeLineup.get("complete") || !(Boolean) awayLineup.get("complete")) {
            throw new IllegalStateException("Um dos clubes não possui escalação completa");
        }

        List<JogadorModel> homeTitulares = (List<JogadorModel>) homeLineup.get("players");
        List<JogadorModel> awayTitulares = (List<JogadorModel>) awayLineup.get("players");

        String formHome = (String) homeLineup.get("formation");
        String formAway = (String) awayLineup.get("formation");

        List<DuelosPartidaModel> duelos = new ArrayList<>();
        int golsHome = 0;
        int golsAway = 0;

        for (int i = 1; i <= 3; i++) {
            DuelosPartidaModel duelo = simularDueloLegado(i, mandanteClube, homeTitulares, visitanteClube,
                    awayTitulares);
            if (duelo.getGol())
                golsHome++;
            duelos.add(duelo);
        }

        for (int i = 4; i <= 6; i++) {
            DuelosPartidaModel duelo = simularDueloLegado(i, visitanteClube, awayTitulares, mandanteClube,
                    homeTitulares);
            if (duelo.getGol())
                golsAway++;
            duelos.add(duelo);
        }

        PartidaModel partida = new PartidaModel();
        partida.setMandante(mandanteClube);
        partida.setVisitante(visitanteClube);
        partida.setGolsMandante(golsHome);
        partida.setGolsVisitante(golsAway);
        partida.setFormacaoMandante(formHome);
        partida.setFormacaoVisitante(formAway);

        partida = partidaRepository.save(partida);

        for (DuelosPartidaModel d : duelos) {
            d.setPartida(partida);
        }

        if (duelosPartidaRepository != null) {
            duelosPartidaRepository.saveAll(duelos);
        }

        return partidaRepository.save(partida);
    }

    private DuelosPartidaModel simularDueloLegado(int ordem, ClubeModel clubeAtacante, List<JogadorModel> atacantesList,
            ClubeModel clubeDefensor, List<JogadorModel> defensoresList) {
        JogadorModel atkPlayer;
        JogadorModel defPlayer;

        if (ordem == 1 || ordem == 4) {
            atkPlayer = atacantesList.get(4);
            defPlayer = defensoresList.get(0);
        } else if (ordem == 2 || ordem == 5) {
            atkPlayer = atacantesList.get(3);
            defPlayer = defensoresList.get(1);
        } else {
            atkPlayer = atacantesList.get(2);
            defPlayer = defensoresList.get(2);
        }

        String atkTipo = getAtributoAtacante(atkPlayer.getPosicao());
        int atkVal = getValorAtributo(atkPlayer, atkTipo);
        int defVal = getValorAtributo(defPlayer, "defending");

        boolean gol = atkVal > defVal;

        DuelosPartidaModel d = new DuelosPartidaModel();
        d.setOrdem(ordem);
        d.setClubeAtacante(clubeAtacante);
        d.setAtacante(atkPlayer);
        d.setDefensor(defPlayer);
        d.setNomeAtacante(atkPlayer.getNome());
        d.setNomeDefensor(defPlayer.getNome());
        d.setPosicaoAtacante(atkPlayer.getPosicao());
        d.setPosicaoDefensor(defPlayer.getPosicao());
        d.setCondicaoAtacante(atkPlayer.getCondicao());
        d.setCondicaoDefensor(defPlayer.getCondicao());
        d.setAtributoAtaque(atkTipo);
        d.setAtributoDefesa("defending");
        d.setValorAtaque(atkVal);
        d.setValorDefesa(defVal);
        d.setGol(gol);

        return d;
    }

    private String getAtributoAtacante(String pos) {
        if (pos == null)
            return "shooting";
        return switch (pos.toUpperCase()) {
            case "ATA" -> "shooting";
            case "MEI" -> "passing";
            case "ZAG", "LAT" -> "dribbling";
            default -> "shooting";
        };
    }

    private int getValorAtributo(JogadorModel jogador, String atributo) {
        int base = switch (atributo) {
            case "shooting" -> jogador.getFinalizacao() != null ? jogador.getFinalizacao() : 0;
            case "passing" -> jogador.getPasse() != null ? jogador.getPasse() : 0;
            case "dribbling" -> jogador.getDrible() != null ? jogador.getDrible() : 0;
            case "defending" -> jogador.getDefesa() != null ? jogador.getDefesa() : 0;
            default -> 0;
        };

        if ("MAL_CONDICIONADO".equalsIgnoreCase(jogador.getCondicao())) {
            double calculado = base * 0.85;
            return (int) Math.round(calculado);
        }
        return base;
    }

    public List<Map<String, Object>> calcularClassificacao() {
        List<ClubeModel> clubes = clubeRepository.findAll();
        List<PartidaModel> partidas = partidaRepository.findAll();

        Map<Long, EstatisticasClube> stats = new HashMap<>();
        for (ClubeModel c : clubes) {
            stats.put(c.getId().longValue(), new EstatisticasClube(c.getId().longValue(), c.getNome()));
        }

        for (PartidaModel p : partidas) {
            Long mandanteId = p.getMandante().getId().longValue();
            Long visitanteId = p.getVisitante().getId().longValue();

            EstatisticasClube mandante = stats.get(mandanteId);
            EstatisticasClube visitante = stats.get(visitanteId);

            if (mandante != null && visitante != null) {
                mandante.jogos++;
                visitante.jogos++;

                mandante.golsFor += p.getGolsMandante();
                mandante.golsAgainst += p.getGolsVisitante();
                visitante.golsFor += p.getGolsVisitante();
                visitante.golsAgainst += p.getGolsMandante();

                if (p.getGolsMandante() > p.getGolsVisitante()) {
                    mandante.vitorias++;
                    mandante.pontos += 3;
                    visitante.derrotas++;
                } else if (p.getGolsMandante() < p.getGolsVisitante()) {
                    visitante.vitorias++;
                    visitante.pontos += 3;
                    mandante.derrotas++;
                } else {
                    mandante.empates++;
                    mandante.pontos += 1;
                    visitante.empates++;
                    visitante.pontos += 1;
                }
            }
        }

        List<EstatisticasClube> lista = new ArrayList<>(stats.values());
        lista.sort((a, b) -> {
            if (b.pontos != a.pontos)
                return Integer.compare(b.pontos, a.pontos);
            int saldoA = a.golsFor - a.golsAgainst;
            int saldoB = b.golsFor - b.golsAgainst;
            if (saldoB != saldoA)
                return Integer.compare(saldoB, saldoA);
            if (b.golsFor != a.golsFor)
                return Integer.compare(b.golsFor, a.golsFor);
            String nomeA = TextoUtils.normalizar(a.nome);
            String nomeB = TextoUtils.normalizar(b.nome);
            return nomeA.compareTo(nomeB);
        });

        List<Map<String, Object>> resultado = new ArrayList<>();
        int posicao = 1;
        for (EstatisticasClube ec : lista) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("position", posicao++);
            m.put("club_id", ec.id);
            m.put("club_name", ec.nome);
            m.put("played", ec.jogos);
            m.put("wins", ec.vitorias);
            m.put("draws", ec.empates);
            m.put("losses", ec.derrotas);
            m.put("goals_for", ec.golsFor);
            m.put("goals_against", ec.golsAgainst);
            m.put("goal_difference", ec.golsFor - ec.golsAgainst);
            m.put("points", ec.pontos);
            resultado.add(m);
        }

        return resultado;
    }

    private static class EstatisticasClube {
        Long id;
        String nome;
        int jogos = 0, vitorias = 0, empates = 0, derrotas = 0, golsFor = 0, golsAgainst = 0, pontos = 0;

        public EstatisticasClube(Long id, String nome) {
            this.id = id;
            this.nome = nome;
        }
    }
}