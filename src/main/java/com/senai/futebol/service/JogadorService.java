package com.senai.futebol.service;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.JogadorRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;


@Service
public class JogadorService {

    private JogadorRepository repository;

    private JogadorService (JogadorRepository repository) {
        this.repository = repository;
    }

    public JogadorModel salvarJogador(JogadorModel jogador){

        int overall = calcularOverall(jogador);

        //2. média overall

        BigDecimal valorBase = calcularValorBase(overall, jogador.getIdade(), jogador.getPotencial());
        jogador.setValorBase(valorBase);

        if  (jogador.getCondicao() == null){
            jogador.setCondicao("APTO");
        }

        //1. cadastro jogador
        return repository.save(jogador);

    };


    public int calcularOverall(JogadorModel jogador) {

        int pesoVelocidade = 0, pesoFinalizacao = 0, pesoPasse = 0;
        int pesoDrible = 0, pesoDefesa = 0, pesoFisico = 0;

        // 1 definir pesos conforme a posição
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

        // Soma dos atributos
        int somaProdutos = (jogador.getVelocidade() * pesoVelocidade) +
                (jogador.getFinalizacao() * pesoFinalizacao) +
                (jogador.getPasse() * pesoPasse) +
                (jogador.getDrible() * pesoDrible) +
                (jogador.getDefesa() * pesoDefesa) +
                (jogador.getFisico() * pesoFisico);

        // Divisão por 100 e arredondamento para o inteiro mais próximo acima.
        double media = somaProdutos / 100.0;
        return (int) Math.round(media);
    }

    public BigDecimal calcularValorBase(int overall, int idade, int potencial) {
        double parteOverall = 0.0;

        // Parte do Overall progressiva
        if (overall > 40 && overall <= 60) {
            parteOverall = (overall - 40) * 0.50;
        } else if (overall > 60 && overall <= 75) {
            parteOverall = (20 * 0.50) + ((overall - 60) * 2.00);
        } else if (overall > 75 && overall <= 99) {
            parteOverall = (20 * 0.50) + (15 * 2.00) + ((overall - 75) * 6.00);
        }

        // Bónus de Jovem Promessa (idade <= 21 anos)
        if (idade <= 21) {
            parteOverall = parteOverall * ((100.0 + potencial - overall) / 100.0);
        }

        // Arredondamento para 2 casas decimais (HALF_UP) e aplicação do piso de 1.00
        BigDecimal valorFinal = BigDecimal.valueOf(parteOverall).setScale(2, RoundingMode.HALF_UP);

        if (valorFinal.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return valorFinal;
    }

    public BigDecimal calcularValorDeMercado(JogadorModel jogador) {
        double valorBase = jogador.getValorBase() != null ? jogador.getValorBase().doubleValue() : 0.0;

        // 1. desconto por condição física
        double descontoCondicao = 0.0;
        String condicao = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        if (condicao.equals("MAL_CONDICIONADO")) {
            descontoCondicao = 15.0;
        } else if (condicao.equals("DOENTE")) {
            descontoCondicao = 30.0;
        }

        // 2. efeito da agilidade - apenas se estiver != de apto
        int agilidade = jogador.getAgilidade();
        if (!condicao.equals("APTO")) {
            if (agilidade >= 80 && agilidade <= 100) {
                descontoCondicao = descontoCondicao / 2.0; // cai pela metade
            } else if (agilidade >= 1 && agilidade <= 30) {
                descontoCondicao = descontoCondicao + 10.0; // aumenta 10 pontos
            }
        }

        // 3. Ajuste por idade -RN04-
        double ajusteIdade = 0.0;
        int idade = jogador.getIdade();
        if (idade <= 21) {
            ajusteIdade = 10.0; // jovem promessa +10%
        } else if (idade >= 32) {
            ajusteIdade = -10.0; // veterano -10%
        }

        // 4. Percentual total = ajuste por idade - desconto por condição
        double percentualTotal = ajusteIdade - descontoCondicao;

        // 5. Teto do desconto (-40%)
        if (percentualTotal < -40.0) {
            percentualTotal = -40.0;
        }

        // 6. Valor de mercado = valor base * (100 + percentualTotal) / 100
        double valorMercado = valorBase * (100.0 + percentualTotal) / 100.0;

        // 7. Piso de 1.00
        BigDecimal resultado = BigDecimal.valueOf(valorMercado).setScale(2, java.math.RoundingMode.HALF_UP);
        if (resultado.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return resultado;
    }


    public JogadorModel buscarPoId(Integer id) {
        return repository.findById(id).orElse(null);
    }

}
