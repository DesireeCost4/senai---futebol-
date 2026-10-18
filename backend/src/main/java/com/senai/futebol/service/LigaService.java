package com.senai.futebol.service;

import com.senai.futebol.model.*;
import com.senai.futebol.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
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

    private static final List<String> FORMATIONS_VALIDAS = List.of("3-1", "2-2", "2-1-1", "1-2-1");

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

        long goleiros = 0;
        long defesa = 0;
        long meio = 0;
        long ataque = 0;

        for (JogadorModel jogador : jogadores) {
            // Validar se o jogador pertence ao clube através do repositório de contratos
            boolean pertenceAoClube = contratoRepository.jogadorJaPertenceuaoClube(clubeId.intValue(), jogador.getId());
            if (!pertenceAoClube || jogador.getExcluidoEm() != null) {
                throw new IllegalStateException("Jogador não pertence ao elenco do clube ou está excluído");
            }
            if ("DOENTE".equalsIgnoreCase(jogador.getCondicao())) {
                throw new IllegalStateException("Jogador doente não pode ser escalado");
            }

            if ("GOL".equalsIgnoreCase(jogador.getPosicao())) {
                goleiros++;
            } else if ("ZAG".equalsIgnoreCase(jogador.getPosicao()) || "LAT".equalsIgnoreCase(jogador.getPosicao())) {
                defesa++;
            } else if ("MEI".equalsIgnoreCase(jogador.getPosicao())) {
                meio++;
            } else if ("ATA".equalsIgnoreCase(jogador.getPosicao())) {
                ataque++;
            }
        }

        if (goleiros != 1) {
            throw new IllegalStateException("A escalação deve ter exatamente 1 goleiro");
        }

        validarSetoresFormacao(formation, defesa, meio, ataque);

        // Salvar escalação
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
                .thenComparing(j -> Normalizer.normalize(j.getNome(), Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase())
                .thenComparing(JogadorModel::getId)
        );

        boolean complete = clube.getFormacao() != null && jogadores.size() == 5;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("club_id", clube.getId());
        resp.put("formation", clube.getFormacao());
        resp.put("complete", complete);
        resp.put("players", jogadores);
        return resp;
    }

    private int prioridadePosicao(String pos) {
        return switch (pos.toUpperCase()) {
            case "GOL" -> 1;
            case "ZAG" -> 2;
            case "LAT" -> 3;
            case "MEI" -> 4;
            case "ATA" -> 5;
            default -> 6;
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
            DuelosPartidaModel duelo = simularDuelo(i, mandanteClube, homeTitulares, visitanteClube, awayTitulares);
            if (duelo.getGol()) golsHome++;
            duelos.add(duelo);
        }

        for (int i = 4; i <= 6; i++) {
            DuelosPartidaModel duelo = simularDuelo(i, visitanteClube, awayTitulares, mandanteClube, homeTitulares);
            if (duelo.getGol()) golsAway++;
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

        return partidaRepository.save(partida);
    }

    private DuelosPartidaModel simularDuelo(int ordem, ClubeModel clubeAtacante, List<JogadorModel> atacantesList,
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
        return switch (pos.toUpperCase()) {
            case "ATA" -> "shooting";
            case "MEI" -> "passing";
            case "ZAG", "LAT" -> "dribbling";
            default -> "shooting";
        };
    }

    private int getValorAtributo(JogadorModel jogador, String atributo) {
        int base = switch (atributo) {
            case "shooting" -> jogador.getFinalizacao();
            case "passing" -> jogador.getPasse();
            case "dribbling" -> jogador.getDrible();
            case "defending" -> jogador.getDefesa();
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
            if (b.pontos != a.pontos) return Integer.compare(b.pontos, a.pontos);
            int saldoA = a.golsFor - a.golsAgainst;
            int saldoB = b.golsFor - b.golsAgainst;
            if (saldoB != saldoA) return Integer.compare(saldoB, saldoA);
            if (b.golsFor != a.golsFor) return Integer.compare(b.golsFor, a.golsFor);
            String nomeA = Normalizer.normalize(a.nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
            String nomeB = Normalizer.normalize(b.nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
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