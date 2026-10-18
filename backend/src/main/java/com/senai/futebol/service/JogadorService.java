package com.senai.futebol.service;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.JogadorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class JogadorService {

    private final JogadorRepository repository;

    public JogadorService(JogadorRepository repository) {
        this.repository = repository;
    }

    public JogadorModel salvarJogador(JogadorModel jogador) {

        int overall = calcularOverall(jogador);

        //evita problemas de compatibilidade entre null e conversão de tipos incopativeis
        int velocidade = jogador.getVelocidade() != null ? jogador.getVelocidade() : 0;
        int finalizacao = jogador.getFinalizacao() != null ? jogador.getFinalizacao() : 0;
        int passe = jogador.getPasse() != null ? jogador.getPasse() : 0;
        int drible = jogador.getDrible() != null ? jogador.getDrible() : 0;
        int defesa = jogador.getDefesa() != null ? jogador.getDefesa() : 0;
        int fisico = jogador.getFisico() != null ? jogador.getFisico() : 0;
        int potencial = jogador.getPotencial() != null ? jogador.getPotencial() : 0;
        int idade = jogador.getIdade() != null ? jogador.getIdade() : 0;

        // Validação da soma dos atributos
        int somaAtributos = velocidade + finalizacao + passe + drible + defesa + fisico;
        if (somaAtributos > 480) {
            throw new IllegalArgumentException("A soma dos 6 atributos técnicos não pode ultrapassar 480.");
        }

        // Regra potencial não pode ser menor que o maior dos atributos
        int maiorAtributo = Math.max(Math.max(Math.max(velocidade, finalizacao), Math.max(passe, drible)), Math.max(defesa, fisico));
        if (potencial < maiorAtributo) {
            throw new IllegalArgumentException("O potencial não pode ser menor que o maior dos 6 atributos.");
        }

        // cálculo da média geral
        BigDecimal valorBase = calcularValorBase(overall, idade, potencial);
        jogador.setValorBase(valorBase);

        if (jogador.getCondicao() == null) {
            jogador.setCondicao("APTO");
        }

        Instant agora = Instant.now();
        if (jogador.getCriadoEm() == null) {
            jogador.setCriadoEm(agora);
        }
        jogador.setAtualizadoEm(agora);

        return repository.save(jogador);
    }

    public int calcularOverall(JogadorModel jogador) {
        int pesoVelocidade = 0, pesoFinalizacao = 0, pesoPasse = 0;
        int pesoDrible = 0, pesoDefesa = 0, pesoFisico = 0;

        int vel = jogador.getVelocidade() != null ? jogador.getVelocidade() : 0;
        int fin = jogador.getFinalizacao() != null ? jogador.getFinalizacao() : 0;
        int pas = jogador.getPasse() != null ? jogador.getPasse() : 0;
        int dri = jogador.getDrible() != null ? jogador.getDrible() : 0;
        int def = jogador.getDefesa() != null ? jogador.getDefesa() : 0;
        int fis = jogador.getFisico() != null ? jogador.getFisico() : 0;

        if (jogador.getPosicao() != null) {
            switch (jogador.getPosicao().toUpperCase()) {
                case "GOL":
                    pesoVelocidade = 10; pesoPasse = 20; pesoDefesa = 40; pesoFisico = 30;
                    break;
                case "ZAG":
                    pesoVelocidade = 10; pesoPasse = 15; pesoDefesa = 45; pesoFisico = 30;
                    break;
                case "LAT":
                    pesoVelocidade = 25; pesoPasse = 20; pesoDrible = 15; pesoDefesa = 25; pesoFisico = 15;
                    break;
                case "MEI":
                    pesoVelocidade = 10; pesoFinalizacao = 15; pesoPasse = 35; pesoDrible = 25; pesoDefesa = 5; pesoFisico = 10;
                    break;
                case "ATA":
                    pesoVelocidade = 20; pesoFinalizacao = 40; pesoPasse = 10; pesoDrible = 20; pesoFisico = 10;
                    break;
            }
        }

        int somaProdutos = (vel * pesoVelocidade) +
                (fin * pesoFinalizacao) +
                (pas * pesoPasse) +
                (dri * pesoDrible) +
                (def * pesoDefesa) +
                (fis * pesoFisico);

        double media = somaProdutos / 100.0;
        return (int) Math.round(media);
    }

    public BigDecimal calcularValorBase(int overall, int idade, int potencial) {
        double parteOverall = 0.0;

        if (overall > 40 && overall <= 60) {
            parteOverall = (overall - 40) * 0.50;
        } else if (overall > 60 && overall <= 75) {
            parteOverall = (20 * 0.50) + ((overall - 60) * 2.00);
        } else if (overall > 75 && overall <= 99) {
            parteOverall = (20 * 0.50) + (15 * 2.00) + ((overall - 75) * 6.00);
        }

        if (idade <= 21) {
            parteOverall = parteOverall * ((100.0 + potencial - overall) / 100.0);
        }

        BigDecimal valorFinal = BigDecimal.valueOf(parteOverall).setScale(2, RoundingMode.HALF_UP);

        if (valorFinal.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return valorFinal;
    }

    public BigDecimal calcularValorDeMercado(JogadorModel jogador) {
        double valorBase = jogador.getValorBase() != null ? jogador.getValorBase().doubleValue() : 0.0;

        double descontoCondicao = 0.0;
        String condicao = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        if (condicao.equals("MAL_CONDICIONADO")) {
            descontoCondicao = 15.0;
        } else if (condicao.equals("DOENTE")) {
            descontoCondicao = 30.0;
        }

        int agilidade = jogador.getAgilidade();
        if (!condicao.equals("APTO")) {
            if (agilidade >= 80 && agilidade <= 100) {
                descontoCondicao = descontoCondicao / 2.0;
            } else if (agilidade >= 1 && agilidade <= 30) {
                descontoCondicao = descontoCondicao + 10.0;
            }
        }

        double ajusteIdade = 0.0;
        int idade = jogador.getIdade();
        if (idade <= 21) {
            ajusteIdade = 10.0;
        } else if (idade >= 32) {
            ajusteIdade = -10.0;
        }

        double percentualTotal = ajusteIdade - descontoCondicao;

        if (percentualTotal < -40.0) {
            percentualTotal = -40.0;
        }

        double valorMercado = valorBase * (100.0 + percentualTotal) / 100.0;

        BigDecimal resultado = BigDecimal.valueOf(valorMercado).setScale(2, RoundingMode.HALF_UP);
        if (resultado.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return resultado;
    }

    public JogadorModel buscarPoId(Integer id) {
        return repository.findById(id).orElse(null);
    }

    public List<JogadorModel> listarTodosJogadores() {
        return repository.findAll();
    }

    public JogadorModel atualizarJogador(Integer id, JogadorModel dadosAtualizados) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return null;
        }

        if (dadosAtualizados.getIdade() < jogador.getIdade()) {
            throw new IllegalArgumentException("A nova idade não pode ser menor que a idade atual.");
        }

        jogador.setNome(dadosAtualizados.getNome());
        jogador.setPosicao(dadosAtualizados.getPosicao());
        jogador.setAgilidade(dadosAtualizados.getAgilidade());
        jogador.setIdade(dadosAtualizados.getIdade());
        jogador.setAtualizadoEm(Instant.now());

        return repository.save(jogador);
    }

    public JogadorModel alterarCondicao(Integer id, String novaCondicao) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return null;
        }

        String condicaoAtual = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        if (condicaoAtual.equals("DOENTE") && novaCondicao.equals("APTO")) {
            throw new IllegalArgumentException("Um jogador doente não pode ir diretamente para apto.");
        }

        jogador.setCondicao(novaCondicao);
        jogador.setAtualizadoEm(Instant.now());
        return repository.save(jogador);
    }

    public boolean excluirJogador(Integer id) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return false;
        }

        jogador.setExcluidoEm(Instant.now());
        jogador.setAtualizadoEm(Instant.now());
        repository.save(jogador);
        return true;
    }

    public Page<JogadorModel> listarComFiltros(String search, String posicao, String condicao, Pageable pageable) {
        return repository.filtrarJogadores(search, posicao, condicao, pageable);
    }

}