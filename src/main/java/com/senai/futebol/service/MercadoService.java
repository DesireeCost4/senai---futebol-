package com.senai.futebol.service;

import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.model.ContratoModel;
import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.model.TransacoesModel;
import com.senai.futebol.repository.ClubeRepository;
import com.senai.futebol.repository.ContratoRepository;
import com.senai.futebol.repository.JogadorRepository;
import com.senai.futebol.repository.TransacoesRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class MercadoService {

    private final JogadorRepository jogadorRepository;
    private final ClubeRepository clubeRepository;
    private final ContratoRepository contratoRepository;
    private final TransacoesRepository transacoesRepository;
    private final JogadorService jogadorService;

    public MercadoService(JogadorRepository jogadorRepository,
                          ClubeRepository clubeRepository,
                          ContratoRepository contratoRepository,
                          TransacoesRepository transacoesRepository,
                          JogadorService jogadorService) {
        this.jogadorRepository = jogadorRepository;
        this.clubeRepository = clubeRepository;
        this.contratoRepository = contratoRepository;
        this.transacoesRepository = transacoesRepository;
        this.jogadorService = jogadorService;
    }

    @Transactional
    public void comprarJogador(Integer jogadorId, Integer clubeId) {

        // validar se o jogador existe e está livre
        JogadorModel jogador = jogadorRepository.findById(jogadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador não encontrado"));

        if (jogador.getExcluidoEm() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador inexistente");
        }

        // verificar se o jogador já tem contrato ativo
        Optional<ContratoModel> contratoAtivo = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO");
        if (contratoAtivo.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O jogador já pertence a um clube");
        }

        // verificar se o clube existe
        ClubeModel clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clube não encontrado"));

        // proibição de Recompra
        boolean jaVendeuAntes = contratoRepository.jogadorJaPertenceuaoClube(clubeId, jogadorId);
        if (jaVendeuAntes) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O clube não pode recomprar um jogador que já vendeu anteriormente");
        }

        // limite de Elenco - máximo de 12 jogadores ATIVOS
        long totalElenco = contratoRepository.contagemJogadoresNoTime(clubeId, "ATIVO");
        if (totalElenco >= 12) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O clube atingiu o limite máximo de 12 jogadores no elenco");
        }

        // cálculo do Valor de Mercado Dinâmico usando o metodo criado no JogadorService!)
        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);

        BigDecimal taxa = BigDecimal.ZERO;
        if (valorMercado.compareTo(new BigDecimal("30.00")) > 0) {
            taxa = valorMercado.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal custoTotal = valorMercado.add(taxa);

        // teto de 50% do Caixa
        BigDecimal limiteCaixa = clube.getCaixa().multiply(new BigDecimal("0.50"));
        if (custoTotal.compareTo(limiteCaixa) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O custo total excede 50% do caixa atual do clube");
        }

        // efetuar a transação financeira no caixa do clube
        clube.setCaixa(clube.getCaixa().subtract(custoTotal));
        clubeRepository.save(clube);

        // criar novo contrato
        ContratoModel novoContrato = new ContratoModel();
        novoContrato.setJogador(jogador);
        novoContrato.setClube(clube);
        novoContrato.setValorCompra(valorMercado);
        novoContrato.setFidelidadeAte(Instant.now().plus(180, ChronoUnit.DAYS)); // prazo de fidelidade
        novoContrato.setSituacao("ATIVO");
        novoContrato.setIniciadoEm(Instant.now());
        contratoRepository.save(novoContrato);

        // registrar na tabela de transações
        TransacoesModel transacao = new TransacoesModel();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("COMPRA");
        transacao.setValor(valorMercado);
        transacao.setTaxa(taxa);
        transacao.setMulta(BigDecimal.ZERO);
        transacao.setLucro(null);
        transacao.setVariacaoCaixa(custoTotal.negate());
        transacao.setCriadoEm(Instant.now());
        transacoesRepository.save(transacao);
    }

    @Transactional
    public void venderJogador(Integer jogadorId, Integer clubeId) {

        // validar se o contrato existe para o clube e jogador
        ContratoModel contratoAtivo = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Não foi encontrado contrato ativo para este jogador"));

        // verificar se o jogador pertence realmente ao clube
        if (!contratoAtivo.getClube().getId().equals(clubeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O jogador não pertence a este clube");
        }

        ClubeModel clube = contratoAtivo.getClube();
        JogadorModel jogador = contratoAtivo.getJogador();

        // calcular o valor de mercado atual do jogador
        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);

        // calcular dias restantes de fidelidade
        long diasRestantes = ChronoUnit.DAYS.between(Instant.now(), contratoAtivo.getFidelidadeAte());
        if (diasRestantes < 0) {
            diasRestantes = 0;
        }

        // calcular a multa fidelidade
        BigDecimal percentualMulta = BigDecimal.ZERO;
        if (diasRestantes >= 1 && diasRestantes <= 30) {
            percentualMulta = new BigDecimal("0.05"); // 5%
        } else if (diasRestantes >= 31 && diasRestantes <= 180) {
            percentualMulta = new BigDecimal("0.10"); // 10%
        } else if (diasRestantes > 180) {
            percentualMulta = new BigDecimal("0.20"); // 20%
        }

        BigDecimal multa = valorMercado.multiply(percentualMulta).setScale(2, RoundingMode.HALF_UP);
        // teto máximo da multa é 10.00
        if (multa.compareTo(new BigDecimal("10.00")) > 0) {
            multa = new BigDecimal("10.00");
        }

        // calcular comissão progressiva sobre o Lucro
        BigDecimal valorCompraOriginal = contratoAtivo.getValorCompra();
        BigDecimal lucro = valorMercado.subtract(valorCompraOriginal);
        BigDecimal comissao = BigDecimal.ZERO;

        if (lucro.compareTo(BigDecimal.ZERO) > 0) {
            if (lucro.compareTo(new BigDecimal("10.00")) <= 0) {
                comissao = lucro.multiply(new BigDecimal("0.10")); // 10% sobre o lucro até 10
            } else {
                BigDecimal parte1 = new BigDecimal("10.00").multiply(new BigDecimal("0.10"));
                BigDecimal parte2 = lucro.subtract(new BigDecimal("10.00")).multiply(new BigDecimal("0.20"));
                comissao = parte1.add(parte2);
            }
            comissao = comissao.setScale(2, RoundingMode.HALF_UP);
        } else {
            lucro = BigDecimal.ZERO;
        }

        // cálculo da variação de Caixa: Valor de Mercado - Multa - Comissão
        BigDecimal valorRecebido = valorMercado.subtract(multa).subtract(comissao);
        if (valorRecebido.compareTo(BigDecimal.ZERO) < 0) {
            valorRecebido = BigDecimal.ZERO;
        }

        // atualizar caixa do clube
        clube.setCaixa(clube.getCaixa().add(valorRecebido));
        clubeRepository.save(clube);

        // encerrar o contrato atual
        String novaSituacao = multa.compareTo(BigDecimal.ZERO) > 0 ? "RESCINDIDO" : "ENCERRADO";
        contratoAtivo.setSituacao(novaSituacao);
        contratoAtivo.setEncerradoEm(Instant.now());
        contratoRepository.save(contratoAtivo);

        // registrar na tabela de transações
        TransacoesModel transacao = new TransacoesModel();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("VENDA");
        transacao.setValor(valorMercado);
        transacao.setTaxa(BigDecimal.ZERO);
        transacao.setMulta(multa);
        transacao.setLucro(lucro);
        transacao.setVariacaoCaixa(valorRecebido);
        transacao.setCriadoEm(Instant.now());
        transacoesRepository.save(transacao);
    }


    public List<TransacoesModel> encontrarTransacoesFiltradas(Integer clubeId, String tipo, Integer jogadorId) {
        return transacoesRepository.encontrarTransacoesFiltradas(clubeId, tipo, jogadorId);
    }
}