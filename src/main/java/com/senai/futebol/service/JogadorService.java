package com.senai.futebol.service;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.JogadorRepository;
import org.springframework.stereotype.Service;



@Service
public class JogadorService {

    private JogadorRepository repository;

    private JogadorService (JogadorRepository repository) {
        this.repository = repository;
    }

    public JogadorModel salvarJogador(JogadorModel jogador){

        //1. cadastro jogador
        return repository.save(jogador);

        //2. média overall


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





}
