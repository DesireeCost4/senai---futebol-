package com.senai.futebol;

import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.model.ContratoModel;
import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.ClubeRepository;
import com.senai.futebol.repository.ContratoRepository;
import com.senai.futebol.repository.JogadorRepository;
import com.senai.futebol.repository.TransacoesRepository;
import com.senai.futebol.service.JogadorService;
import com.senai.futebol.service.MercadoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class MercadoServiceTest {

    private JogadorRepository jogadorRepository;
    private ClubeRepository clubeRepository;
    private ContratoRepository contratoRepository;
    private TransacoesRepository transacoesRepository;
    private JogadorService jogadorService;
    private MercadoService mercadoService;

    @BeforeEach
    public void setUp() {
        jogadorRepository = Mockito.mock(JogadorRepository.class);
        clubeRepository = Mockito.mock(ClubeRepository.class);
        contratoRepository = Mockito.mock(ContratoRepository.class);
        transacoesRepository = Mockito.mock(TransacoesRepository.class);
        jogadorService = Mockito.mock(JogadorService.class);

        mercadoService = new MercadoService(
                jogadorRepository,
                clubeRepository,
                contratoRepository,
                transacoesRepository,
                jogadorService
        );
    }

    //testes de compra de jogador

    @Test
    @DisplayName("Deve lançar 404 quando o jogador não for encontrado ao comprar")
    public void deveLancarExcecaoAoComprarJogadorInexistente() {
        when(jogadorRepository.findById(99)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(99, 1);
        });

        assertEquals(404, exception.getStatusCode().value());
        assertEquals("404 NOT_FOUND \"Jogador não encontrado\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 404 quando o jogador estiver marcado como excluído")
    public void deveLancarExcecaoAoComprarJogadorExcluido() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);
        jogador.setExcluidoEm(Instant.now());

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 1);
        });

        assertEquals(404, exception.getStatusCode().value());
        assertEquals("404 NOT_FOUND \"Jogador inexistente\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 409 quando o jogador já possuir contrato ativo")
    public void deveLancarExcecaoQuandoJogadorJaTemContratoAtivo() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(eq(1), eq("ATIVO")))
                .thenReturn(Optional.of(new ContratoModel()));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 1);
        });

        assertEquals(409, exception.getStatusCode().value());
        assertEquals("409 CONFLICT \"O jogador já pertence a um clube\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 404 quando o clube comprador não for encontrado")
    public void deveLancarExcecaoQuandoClubeNaoEncontrado() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(any(), any()))
                .thenReturn(Optional.empty());
        when(clubeRepository.findById(99)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 99);
        });

        assertEquals(404, exception.getStatusCode().value());
        assertEquals("404 NOT_FOUND \"Clube não encontrado\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 409 em caso de tentativa de recompra pelo mesmo clube")
    public void deveLancarExcecaoEmTentativaDeRecompra() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        ClubeModel clube = new ClubeModel();
        clube.setId(1);

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(any(), any()))
                .thenReturn(Optional.empty());
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(contratoRepository.jogadorJaPertenceuaoClube(1, 1)).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 1);
        });

        assertEquals(409, exception.getStatusCode().value());
        assertEquals("409 CONFLICT \"O clube não pode recomprar um jogador que já vendeu anteriormente\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 409 quando o clube atingir o limite máximo de 12 jogadores")
    public void deveLancarExcecaoQuandoElencoCheio() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        ClubeModel clube = new ClubeModel();
        clube.setId(1);

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(any(), any()))
                .thenReturn(Optional.empty());
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(contratoRepository.jogadorJaPertenceuaoClube(1, 1)).thenReturn(false);
        when(contratoRepository.contagemJogadoresNoTime(1, "ATIVO")).thenReturn(12L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 1);
        });

        assertEquals(409, exception.getStatusCode().value());
        assertEquals("409 CONFLICT \"O clube atingiu o limite máximo de 12 jogadores no elenco\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 409 quando o custo total exceder 50% do caixa do clube")
    public void deveLancarExcecaoQuandoCustoExcedeCaixa() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        ClubeModel clube = new ClubeModel();
        clube.setId(1);
        clube.setCaixa(new BigDecimal("100.00")); // Limite 50% = 50.00

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(any(), any()))
                .thenReturn(Optional.empty());
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(contratoRepository.jogadorJaPertenceuaoClube(1, 1)).thenReturn(false);
        when(contratoRepository.contagemJogadoresNoTime(1, "ATIVO")).thenReturn(5L);
        when(jogadorService.calcularValorDeMercado(jogador)).thenReturn(new BigDecimal("60.00")); // Custo com taxa > 50.00

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.comprarJogador(1, 1);
        });

        assertEquals(409, exception.getStatusCode().value());
        assertEquals("409 CONFLICT \"O custo total excede 50% do caixa atual do clube\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve comprar jogador com sucesso quando todas as regras forem atendidas")
    public void deveComprarJogadorComSucesso() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);
        jogador.setNome("Craque");

        ClubeModel clube = new ClubeModel();
        clube.setId(1);
        clube.setCaixa(new BigDecimal("500.00"));

        when(jogadorRepository.findById(1)).thenReturn(Optional.of(jogador));
        when(contratoRepository.buscarContratoAtivoPorJogador(any(), any()))
                .thenReturn(Optional.empty());
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(contratoRepository.jogadorJaPertenceuaoClube(1, 1)).thenReturn(false);
        when(contratoRepository.contagemJogadoresNoTime(1, "ATIVO")).thenReturn(5L);
        when(jogadorService.calcularValorDeMercado(jogador)).thenReturn(new BigDecimal("20.00"));

        assertDoesNotThrow(() -> {
            mercadoService.comprarJogador(1, 1);
        });

        // Verifica se salvou o clube atualizado, o contrato e a transação
        verify(clubeRepository, times(1)).save(clube);
        verify(contratoRepository, times(1)).save(any(ContratoModel.class));
        verify(transacoesRepository, times(1)).save(any(com.senai.futebol.model.TransacoesModel.class));
    }

    // testes de venda

    @Test
    @DisplayName("Deve lançar 404 se não houver contrato ativo para o jogador ao vender")
    public void deveLancarExcecaoAoVenderSemContratoAtivo() {
        when(contratoRepository.buscarContratoAtivoPorJogador(1, "ATIVO"))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.venderJogador(1, 1);
        });

        assertEquals(404, exception.getStatusCode().value());
        assertEquals("404 NOT_FOUND \"Não foi encontrado contrato ativo para este jogador\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve lançar 409 se o jogador não pertencer ao clube informado na venda")
    public void deveLancarExcecaoQuandoJogadorNaoPertenceAoClube() {
        ClubeModel clubeDoContrato = new ClubeModel();
        clubeDoContrato.setId(2); // Clube diferente

        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);

        ContratoModel contrato = new ContratoModel();
        contrato.setClube(clubeDoContrato);
        contrato.setJogador(jogador);

        when(contratoRepository.buscarContratoAtivoPorJogador(1, "ATIVO"))
                .thenReturn(Optional.of(contrato));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            mercadoService.venderJogador(1, 1); // Tentando vender pelo clube ID 1
        });

        assertEquals(409, exception.getStatusCode().value());
        assertEquals("409 CONFLICT \"O jogador não pertence a este clube\"", exception.getMessage());
    }

    @Test
    @DisplayName("Deve vender jogador com sucesso aplicando comissão e multa fidelidade")
    public void deveVenderJogadorComSucesso() {
        ClubeModel clube = new ClubeModel();
        clube.setId(1);
        clube.setCaixa(new BigDecimal("100.00"));

        JogadorModel jogador = new JogadorModel();
        jogador.setId(1);
        jogador.setNome("Craque");

        ContratoModel contrato = new ContratoModel();
        contrato.setClube(clube);
        contrato.setJogador(jogador);
        contrato.setValorCompra(new BigDecimal("20.00"));
        contrato.setFidelidadeAte(Instant.now().plus(60, ChronoUnit.DAYS)); // Categoria 31-180 dias (10% multa)

        when(contratoRepository.buscarContratoAtivoPorJogador(1, "ATIVO"))
                .thenReturn(Optional.of(contrato));
        when(jogadorService.calcularValorDeMercado(jogador)).thenReturn(new BigDecimal("40.00")); // Lucro de 20.00

        assertDoesNotThrow(() -> {
            mercadoService.venderJogador(1, 1);
        });

        verify(clubeRepository, times(1)).save(clube);
        verify(contratoRepository, times(1)).save(contrato);
        verify(transacoesRepository, times(1)).save(any(com.senai.futebol.model.TransacoesModel.class));
    }
}