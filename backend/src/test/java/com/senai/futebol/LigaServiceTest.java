package com.senai.futebol;

import com.senai.futebol.model.*;
import com.senai.futebol.repository.*;
import com.senai.futebol.service.LigaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LigaServiceTest {

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private ClubeRepository clubeRepository;

    @Mock
    private JogadorRepository jogadorRepository;

    @Mock
    private EscalacaoRepository escalacaoRepository;

    @Mock
    private PartidaRepository partidaRepository;

    @InjectMocks
    private LigaService ligaService;

    @Test
    @DisplayName("Deve lançar excepção ao tentar escalar um jogador doente")
    void deveLancarExcecaoQuandoJogadorEstiverDoente() {
        Long clubeId = 1L;
        ClubeModel clube = new ClubeModel();
        clube.setId(clubeId.intValue());
        clube.setFormacao("3-1");

        when(clubeRepository.findById(clubeId.intValue())).thenReturn(Optional.of(clube));

        List<Long> playerIds = List.of(2L, 3L, 4L, 5L, 8L);

        JogadorModel jogadorDoente = new JogadorModel();
        jogadorDoente.setId(2);
        jogadorDoente.setCondicao("DOENTE");
        jogadorDoente.setPosicao("GOL");

        when(jogadorRepository.findAllById(any())).thenReturn(List.of(
                jogadorDoente,
                criarJogador(3, "ZAG"),
                criarJogador(4, "ZAG"),
                criarJogador(5, "ZAG"),
                criarJogador(8, "ATA")
        ));

        when(contratoRepository.jogadorJaPertenceuaoClube(anyInt(), anyInt())).thenReturn(true);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            ligaService.salvarEscalacao(clubeId, "3-1", playerIds);
        });

        assertEquals("Jogador doente não pode ser escalado", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar excepção se as posições não coincidirem com a formação 3-1")
    void defesaDeveValidarSetoresFormacao() {
        Long clubeId = 1L;
        ClubeModel clube = new ClubeModel();
        clube.setId(clubeId.intValue());
        clube.setFormacao("3-1");

        when(clubeRepository.findById(clubeId.intValue())).thenReturn(Optional.of(clube));

        List<Long> playerIds = List.of(2L, 3L, 4L, 5L, 8L);

        when(jogadorRepository.findAllById(any())).thenReturn(List.of(
                criarJogador(2, "GOL"),
                criarJogador(3, "ZAG"),
                criarJogador(4, "ZAG"),
                criarJogador(5, "MEI"),
                criarJogador(8, "ATA")
        ));

        when(contratoRepository.jogadorJaPertenceuaoClube(anyInt(), anyInt())).thenReturn(true);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            ligaService.salvarEscalacao(clubeId, "3-1", playerIds);
        });

        assertEquals("As posições dos jogadores não fecham com a formação escolhida", exception.getMessage());
    }

    @Test
    @DisplayName("Deve simular uma partida com sucesso entre dois clubes")
    void deveSimularPartidaComSucesso() {
        Long homeId = 1L;
        Long awayId = 2L;

        ClubeModel mandante = new ClubeModel();
        mandante.setId(homeId.intValue());
        mandante.setNome("Sport");
        mandante.setFormacao("3-1");

        ClubeModel visitante = new ClubeModel();
        visitante.setId(awayId.intValue());
        visitante.setNome("Náutico");
        visitante.setFormacao("3-1");

        when(clubeRepository.findById(1)).thenReturn(Optional.of(mandante));
        when(clubeRepository.findById(2)).thenReturn(Optional.of(visitante));

        // Mock das escalações completas para mandante e visitante
        EscalacoesModel esc1 = new EscalacoesModel(); esc1.setJogador(criarJogador(2, "GOL"));
        EscalacoesModel esc2 = new EscalacoesModel(); esc2.setJogador(criarJogador(3, "ZAG"));
        EscalacoesModel esc3 = new EscalacoesModel(); esc3.setJogador(criarJogador(4, "ZAG"));
        EscalacoesModel esc4 = new EscalacoesModel(); esc4.setJogador(criarJogador(5, "ZAG"));
        EscalacoesModel esc5 = new EscalacoesModel(); esc5.setJogador(criarJogador(8, "ATA"));

        when(escalacaoRepository.findByClubeId(homeId)).thenReturn(List.of(esc1, esc2, esc3, esc4, esc5));
        when(escalacaoRepository.findByClubeId(awayId)).thenReturn(List.of(esc1, esc2, esc3, esc4, esc5));

        when(partidaRepository.save(any(PartidaModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PartidaModel resultado = ligaService.jogarPartida(homeId, awayId);

        assertNotNull(resultado);
        assertEquals(mandante, resultado.getMandante());
        assertEquals(visitante, resultado.getVisitante());
    }

    @Test
    @DisplayName("Deve calcular a classificação corretamente com base nas partidas")
    void deveCalcularClassificacaoCorretamente() {
        ClubeModel c1 = new ClubeModel(); c1.setId(1); c1.setNome("Clube A");
        ClubeModel c2 = new ClubeModel(); c2.setId(2); c2.setNome("Clube B");

        when(clubeRepository.findAll()).thenReturn(List.of(c1, c2));

        PartidaModel p = new PartidaModel();
        p.setMandante(c1);
        p.setVisitante(c2);
        p.setGolsMandante(2);
        p.setGolsVisitante(1);

        when(partidaRepository.findAll()).thenReturn(List.of(p));

        List<Map<String, Object>> classificacao = ligaService.calcularClassificacao();

        assertNotNull(classificacao);
        assertEquals(2, classificacao.size());

        // Clube A deve ser o primeiro (venceu o jogo)
        Map<String, Object> primeiro = classificacao.get(0);
        assertEquals("Clube A", primeiro.get("club_name"));
        assertEquals(3, primeiro.get("points"));
        assertEquals(1, primeiro.get("wins"));
    }

    private JogadorModel criarJogador(int id, String posicao) {
        JogadorModel j = new JogadorModel();
        j.setId(id);
        j.setNome("Jogador " + id);
        j.setPosicao(posicao);
        j.setCondicao("BOM");
        j.setFinalizacao(80);
        j.setDefesa(80);
        j.setDrible(80);
        j.setPasse(80);
        return j;
    }
}
