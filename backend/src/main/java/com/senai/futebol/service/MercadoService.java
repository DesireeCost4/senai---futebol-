package com.senai.futebol.service;

import com.senai.futebol.dto.*;
import com.senai.futebol.exception.NegocioException;
import com.senai.futebol.exception.RecursoNotFoundException;
import com.senai.futebol.exception.ValidacaoException;
import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.model.ContratoModel;
import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.model.TransacoesModel;
import com.senai.futebol.repository.*;
import com.senai.futebol.util.DataUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class MercadoService {

    private final JogadorRepository jogadorRepository;
    private final ClubeRepository clubeRepository;
    private final ContratoRepository contratoRepository;
    private final TransacoesRepository transacoesRepository;
    private final JogadorService jogadorService;

    @Autowired(required = false)
    private EscalacaoRepository escalacaoRepository;

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
    public CompraResponseDTO comprar(Integer jogadorId, CompraRequestDTO dto) {
        if (dto == null || dto.getClubId() == null) {
            throw new ValidacaoException("club_id é obrigatório.");
        }
        if (dto.getClubId() <= 0) {
            throw new ValidacaoException("club_id deve ser um inteiro positivo.");
        }
        if (dto.getLoyaltyUntil() == null || dto.getLoyaltyUntil().isBlank()) {
            throw new ValidacaoException("loyalty_until é obrigatório.");
        }

        JogadorModel jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(jogadorId)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou excluído."));

        // RN12: O jogador precisa estar livre
        if (jogador.getClube() != null) {
            throw new NegocioException("O jogador já pertence a um clube.");
        }
        Optional<ContratoModel> contratoAtivo = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO");
        if (contratoAtivo.isPresent()) {
            throw new NegocioException("O jogador já possui um contrato ativo.");
        }

        ClubeModel clube = clubeRepository.findById(dto.getClubId())
                .orElseThrow(() -> new RecursoNotFoundException("Clube não encontrado."));

        // RN12: Um clube não pode comprar um jogador que ele mesmo já vendeu
        boolean jaVendeu = transacoesRepository.clubeJaVendeuJogador(dto.getClubId(), jogadorId);
        if (jaVendeu) {
            throw new NegocioException("O clube não pode recomprar um jogador que ele mesmo já vendeu.");
        }

        // RN14: Limite de elenco - máximo 12 jogadores por clube
        long totalElenco = contratoRepository.contagemJogadoresNoTime(dto.getClubId(), "ATIVO");
        if (totalElenco >= 12) {
            throw new NegocioException("O clube atingiu o limite máximo de 12 jogadores no elenco.");
        }

        Instant agora = Instant.now();
        Instant loyaltyUntil = DataUtils.parsearDataEntrada(dto.getLoyaltyUntil());

        if (!loyaltyUntil.isAfter(agora)) {
            throw new ValidacaoException("loyalty_until deve ser posterior ao momento da compra.");
        }

        long diasFidelidade = Duration.between(agora, loyaltyUntil).toDays();
        if (diasFidelidade > 1095) {
            throw new ValidacaoException("loyalty_until não pode ultrapassar 1.095 dias a partir da data atual.");
        }

        // RN05: Valor de mercado
        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);

        // RN13: Taxa de compra (5% se valor > 30.00)
        BigDecimal taxa = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (valorMercado.compareTo(new BigDecimal("30.00")) > 0) {
            taxa = valorMercado.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal custoTotal = valorMercado.add(taxa).setScale(2, RoundingMode.HALF_UP);

        // Limite de 50% do caixa sem arredondamento
        BigDecimal limiteCaixa = clube.getCaixa().multiply(new BigDecimal("0.5"));
        if (custoTotal.compareTo(limiteCaixa) > 0) {
            throw new NegocioException("O custo total da compra (" + custoTotal + ") ultrapassa o limite de 50% do caixa (" + limiteCaixa + ").");
        }

        // Atualiza caixa do clube
        BigDecimal novoCaixa = clube.getCaixa().subtract(custoTotal).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        // Vincula o jogador ao clube
        jogador.setClube(clube);
        jogador.setAtualizadoEm(agora);
        jogadorRepository.save(jogador);

        // Cria o contrato ATIVO
        ContratoModel contrato = new ContratoModel();
        contrato.setJogador(jogador);
        contrato.setClube(clube);
        contrato.setValorCompra(valorMercado);
        contrato.setFidelidadeAte(loyaltyUntil);
        contrato.setSituacao("ATIVO");
        contrato.setIniciadoEm(agora);
        contrato = contratoRepository.save(contrato);

        // Grava transação COMPRA
        TransacoesModel transacao = new TransacoesModel();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("COMPRA");
        transacao.setValor(valorMercado);
        transacao.setTaxa(taxa);
        transacao.setMulta(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        transacao.setLucro(null);
        transacao.setVariacaoCaixa(custoTotal.negate().setScale(2, RoundingMode.HALF_UP));
        transacao.setCriadoEm(agora);
        transacao = transacoesRepository.save(transacao);

        // Monta DTO de resposta
        CompraResponseDTO resp = new CompraResponseDTO();
        resp.setId(transacao.getId());
        resp.setClubId(clube.getId());
        resp.setPlayerId(jogador.getId());
        resp.setPlayerName(jogador.getNome());
        resp.setType("COMPRA");
        resp.setValue(valorMercado);
        resp.setFee(taxa);
        resp.setPenalty(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        resp.setProfit(null);
        resp.setCashChange(custoTotal.negate().setScale(2, RoundingMode.HALF_UP));
        resp.setCreatedAt(DataUtils.formatarBrasilia(agora));

        ContratoResumoDTO cResumo = new ContratoResumoDTO(
                valorMercado,
                DataUtils.formatarBrasilia(loyaltyUntil),
                "ATIVO"
        );
        resp.setContract(cResumo);
        resp.setClubCash(novoCaixa);

        return resp;
    }

    @Transactional
    public VendaResponseDTO vender(Integer jogadorId) {
        JogadorModel jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(jogadorId)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou excluído."));

        if (jogador.getClube() == null) {
            throw new NegocioException("Jogador livre (sem clube) não pode ser vendido.");
        }

        ClubeModel clube = jogador.getClube();
        ContratoModel contrato = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO")
                .orElseThrow(() -> new NegocioException("Não foi encontrado contrato ativo para este jogador."));

        Instant momentoVenda = Instant.now();
        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);
        BigDecimal valorCompra = contrato.getValorCompra();

        // RN15: dias restantes e multa
        long diasRestantes = ClubeService.calcularDiasRestantes(momentoVenda, contrato.getFidelidadeAte());
        int percentualMultaInt = ClubeService.calcularPercentualMulta(diasRestantes);
        BigDecimal percentualMulta = BigDecimal.valueOf(percentualMultaInt).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);

        BigDecimal multaCalculada = valorMercado.multiply(percentualMulta).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tetoMulta = new BigDecimal("10.00");
        BigDecimal multaFinal = multaCalculada.compareTo(tetoMulta) > 0 ? tetoMulta : multaCalculada;

        // RN16: Lucro e comissão progressiva
        BigDecimal lucro = valorMercado.subtract(valorCompra).setScale(2, RoundingMode.HALF_UP);
        BigDecimal comissao = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (lucro.compareTo(BigDecimal.ZERO) > 0) {
            if (lucro.compareTo(new BigDecimal("10.00")) <= 0) {
                comissao = lucro.multiply(new BigDecimal("0.10"));
            } else {
                BigDecimal parte1 = new BigDecimal("10.00").multiply(new BigDecimal("0.10"));
                BigDecimal parte2 = lucro.subtract(new BigDecimal("10.00")).multiply(new BigDecimal("0.20"));
                comissao = parte1.add(parte2);
            }
            comissao = comissao.setScale(2, RoundingMode.HALF_UP);
        }

        // Crédito no caixa = valor_mercado - multa - comissao
        BigDecimal credito = valorMercado.subtract(multaFinal).subtract(comissao).setScale(2, RoundingMode.HALF_UP);
        BigDecimal novoCaixa = clube.getCaixa().add(credito).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        // Situação do contrato: RESCINDIDO se houve multa, ENCERRADO sem multa
        String situacao = multaFinal.compareTo(BigDecimal.ZERO) > 0 ? "RESCINDIDO" : "ENCERRADO";
        contrato.setSituacao(situacao);
        contrato.setEncerradoEm(momentoVenda);
        contratoRepository.save(contrato);

        // Jogador volta a ficar livre
        jogador.setClube(null);
        jogador.setAtualizadoEm(momentoVenda);
        jogadorRepository.save(jogador);

        // RN19: Titular vendido sai da escalação
        if (escalacaoRepository != null) {
            escalacaoRepository.deleteByJogadorId(jogadorId);
        }

        // Grava transação VENDA
        TransacoesModel transacao = new TransacoesModel();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("VENDA");
        transacao.setValor(valorMercado);
        transacao.setTaxa(comissao);
        transacao.setMulta(multaFinal);
        transacao.setLucro(lucro);
        transacao.setVariacaoCaixa(credito);
        transacao.setCriadoEm(momentoVenda);
        transacao = transacoesRepository.save(transacao);

        // Monta DTO de resposta
        VendaResponseDTO resp = new VendaResponseDTO();
        resp.setId(transacao.getId());
        resp.setClubId(clube.getId());
        resp.setPlayerId(jogador.getId());
        resp.setPlayerName(jogador.getNome());
        resp.setType("VENDA");
        resp.setValue(valorMercado);
        resp.setFee(comissao);
        resp.setPenalty(multaFinal);
        resp.setProfit(lucro);
        resp.setCashChange(credito);
        resp.setCreatedAt(DataUtils.formatarBrasilia(momentoVenda));
        resp.setPurchaseValue(valorCompra);
        resp.setRemainingDays(diasRestantes);
        resp.setPenaltyRate(percentualMultaInt);
        resp.setContractStatus(situacao);
        resp.setClubCash(novoCaixa);

        return resp;
    }

    public HistoricoTransacoesResponseDTO listarHistorico(Integer clubeId, String type, Integer playerId) {
        if (!clubeRepository.existsById(clubeId)) {
            throw new RecursoNotFoundException("Clube não encontrado.");
        }

        if (playerId != null) {
            Optional<JogadorModel> jOpt = jogadorRepository.findByIdAndExcluidoEmIsNull(playerId);
            if (jOpt.isEmpty()) {
                throw new RecursoNotFoundException("Jogador inexistente ou excluído.");
            }
        }

        List<String> tiposAceitos = new ArrayList<>();
        if (type != null && !type.isBlank()) {
            String[] split = type.split(",");
            for (String t : split) {
                String limpo = t.trim();
                if (!limpo.equals("COMPRA") && !limpo.equals("VENDA")) {
                    throw new ValidacaoException("Tipo de transação inválido. Aceitos: COMPRA ou VENDA.");
                }
                tiposAceitos.add(limpo);
            }
        }

        List<TransacoesModel> todas = transacoesRepository.findByClubeIdOrderByCriadoEmDescIdDesc(clubeId);

        List<TransacaoResponseDTO> data = new ArrayList<>();
        BigDecimal totalSpent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalReceived = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalFees = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPenalties = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalProfit = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (TransacoesModel t : todas) {
            if (!tiposAceitos.isEmpty() && !tiposAceitos.contains(t.getTipo())) {
                continue;
            }
            if (playerId != null && !t.getJogador().getId().equals(playerId)) {
                continue;
            }

            TransacaoResponseDTO dto = new TransacaoResponseDTO();
            dto.setId(t.getId());
            dto.setClubId(t.getClube().getId());
            dto.setPlayerId(t.getJogador().getId());
            dto.setPlayerName(t.getNomeJogador());
            dto.setType(t.getTipo());
            dto.setValue(t.getValor().setScale(2, RoundingMode.HALF_UP));
            dto.setFee(t.getTaxa().setScale(2, RoundingMode.HALF_UP));
            dto.setPenalty(t.getMulta().setScale(2, RoundingMode.HALF_UP));
            dto.setProfit(t.getLucro() != null ? t.getLucro().setScale(2, RoundingMode.HALF_UP) : null);
            dto.setCashChange(t.getVariacaoCaixa().setScale(2, RoundingMode.HALF_UP));
            dto.setCreatedAt(DataUtils.formatarBrasilia(t.getCriadoEm()));
            data.add(dto);

            if ("COMPRA".equals(t.getTipo())) {
                totalSpent = totalSpent.add(t.getValor().add(t.getTaxa()));
            } else if ("VENDA".equals(t.getTipo())) {
                totalReceived = totalReceived.add(t.getVariacaoCaixa());
                totalPenalties = totalPenalties.add(t.getMulta());
                if (t.getLucro() != null) {
                    totalProfit = totalProfit.add(t.getLucro());
                }
            }
            totalFees = totalFees.add(t.getTaxa());
        }

        TransacoesSummaryDTO summary = new TransacoesSummaryDTO(
                totalSpent.setScale(2, RoundingMode.HALF_UP),
                totalReceived.setScale(2, RoundingMode.HALF_UP),
                totalFees.setScale(2, RoundingMode.HALF_UP),
                totalPenalties.setScale(2, RoundingMode.HALF_UP),
                totalProfit.setScale(2, RoundingMode.HALF_UP)
        );

        return new HistoricoTransacoesResponseDTO(data, summary);
    }

    public byte[] exportarCsv(Integer clubeId, String type, Integer playerId) {
        HistoricoTransacoesResponseDTO hist = listarHistorico(clubeId, type, playerId);

        StringBuilder sb = new StringBuilder();
        sb.append("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n");

        for (TransacaoResponseDTO t : hist.getData()) {
            String jogadorEscapado = formatarCsvString(t.getPlayerName());
            String valorStr = formatarMoedaCsv(t.getValue());
            String taxaStr = formatarMoedaCsv(t.getFee());
            String multaStr = formatarMoedaCsv(t.getPenalty());
            String lucroStr = t.getProfit() != null ? formatarMoedaCsv(t.getProfit()) : "";
            String varCaixaStr = formatarMoedaCsv(t.getCashChange());

            sb.append(t.getCreatedAt()).append(";")
                    .append(t.getType()).append(";")
                    .append(jogadorEscapado).append(";")
                    .append(valorStr).append(";")
                    .append(taxaStr).append(";")
                    .append(multaStr).append(";")
                    .append(lucroStr).append(";")
                    .append(varCaixaStr).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String formatarCsvString(String texto) {
        if (texto == null) return "";
        if (texto.contains(";") || texto.contains("\"")) {
            return "\"" + texto.replace("\"", "\"\"") + "\"";
        }
        return texto;
    }

    private String formatarMoedaCsv(BigDecimal valor) {
        if (valor == null) return "0,00";
        return valor.setScale(2, RoundingMode.HALF_UP).toString().replace(".", ",");
    }

    // Métodos legados mantidos para compatibilidade com testes existentes
    @Transactional
    public void comprarJogador(Integer jogadorId, Integer clubeId) {
        JogadorModel jogador = jogadorRepository.findById(jogadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador não encontrado"));

        if (jogador.getExcluidoEm() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogador inexistente");
        }

        Optional<ContratoModel> contratoAtivo = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO");
        if (contratoAtivo.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O jogador já pertence a um clube");
        }

        ClubeModel clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clube não encontrado"));

        boolean jaVendeuAntes = contratoRepository.jogadorJaPertenceuaoClube(clubeId, jogadorId);
        if (jaVendeuAntes) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O clube não pode recomprar um jogador que já vendeu anteriormente");
        }

        long totalElenco = contratoRepository.contagemJogadoresNoTime(clubeId, "ATIVO");
        if (totalElenco >= 12) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O clube atingiu o limite máximo de 12 jogadores no elenco");
        }

        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);
        BigDecimal taxa = BigDecimal.ZERO;
        if (valorMercado.compareTo(new BigDecimal("30.00")) > 0) {
            taxa = valorMercado.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal custoTotal = valorMercado.add(taxa);
        BigDecimal limiteCaixa = clube.getCaixa().multiply(new BigDecimal("0.50"));
        if (custoTotal.compareTo(limiteCaixa) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O custo total excede 50% do caixa atual do clube");
        }

        clube.setCaixa(clube.getCaixa().subtract(custoTotal));
        clubeRepository.save(clube);

        ContratoModel novoContrato = new ContratoModel();
        novoContrato.setJogador(jogador);
        novoContrato.setClube(clube);
        novoContrato.setValorCompra(valorMercado);
        novoContrato.setFidelidadeAte(Instant.now().plus(180, ChronoUnit.DAYS));
        novoContrato.setSituacao("ATIVO");
        novoContrato.setIniciadoEm(Instant.now());
        contratoRepository.save(novoContrato);

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
        ContratoModel contratoAtivo = contratoRepository.buscarContratoAtivoPorJogador(jogadorId, "ATIVO")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Não foi encontrado contrato ativo para este jogador"));

        if (!contratoAtivo.getClube().getId().equals(clubeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O jogador não pertence a este clube");
        }

        ClubeModel clube = contratoAtivo.getClube();
        JogadorModel jogador = contratoAtivo.getJogador();

        BigDecimal valorMercado = jogadorService.calcularValorDeMercado(jogador);
        long diasRestantes = ChronoUnit.DAYS.between(Instant.now(), contratoAtivo.getFidelidadeAte());
        if (diasRestantes < 0) diasRestantes = 0;

        BigDecimal percentualMulta = BigDecimal.ZERO;
        if (diasRestantes >= 1 && diasRestantes <= 30) {
            percentualMulta = new BigDecimal("0.05");
        } else if (diasRestantes >= 31 && diasRestantes <= 180) {
            percentualMulta = new BigDecimal("0.10");
        } else if (diasRestantes > 180) {
            percentualMulta = new BigDecimal("0.20");
        }

        BigDecimal multa = valorMercado.multiply(percentualMulta).setScale(2, RoundingMode.HALF_UP);
        if (multa.compareTo(new BigDecimal("10.00")) > 0) {
            multa = new BigDecimal("10.00");
        }

        BigDecimal valorCompraOriginal = contratoAtivo.getValorCompra();
        BigDecimal lucro = valorMercado.subtract(valorCompraOriginal);
        BigDecimal comissao = BigDecimal.ZERO;

        if (lucro.compareTo(BigDecimal.ZERO) > 0) {
            if (lucro.compareTo(new BigDecimal("10.00")) <= 0) {
                comissao = lucro.multiply(new BigDecimal("0.10"));
            } else {
                BigDecimal parte1 = new BigDecimal("10.00").multiply(new BigDecimal("0.10"));
                BigDecimal parte2 = lucro.subtract(new BigDecimal("10.00")).multiply(new BigDecimal("0.20"));
                comissao = parte1.add(parte2);
            }
            comissao = comissao.setScale(2, RoundingMode.HALF_UP);
        } else {
            lucro = BigDecimal.ZERO;
        }

        BigDecimal valorRecebido = valorMercado.subtract(multa).subtract(comissao);
        if (valorRecebido.compareTo(BigDecimal.ZERO) < 0) {
            valorRecebido = BigDecimal.ZERO;
        }

        clube.setCaixa(clube.getCaixa().add(valorRecebido));
        clubeRepository.save(clube);

        String novaSituacao = multa.compareTo(BigDecimal.ZERO) > 0 ? "RESCINDIDO" : "ENCERRADO";
        contratoAtivo.setSituacao(novaSituacao);
        contratoAtivo.setEncerradoEm(Instant.now());
        contratoRepository.save(contratoAtivo);

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