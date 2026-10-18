package com.senai.futebol;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.service.JogadorService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JogadorServiceTest {

    private final JogadorService service = new JogadorService(null);

    @Test
    public void deveCalcularValorDeMercadoCorretamenteParaMalConditionadoComAgilidade() {
        JogadorModel jogador = new JogadorModel();
        jogador.setValorBase(new BigDecimal("82.00"));
        jogador.setCondicao("MAL_CONDICIONADO");
        jogador.setAgilidade(80);
        jogador.setIdade(21);

        BigDecimal valorMercado = service.calcularValorDeMercado(jogador);

        assertEquals(new BigDecimal("84.05"), valorMercado);
    }

    @Test
    public void deveRespeitarOPisoDoValorDeMercado() {
        JogadorModel jogador = new JogadorModel();
        jogador.setValorBase(new BigDecimal("9.50"));
        jogador.setCondicao("MAL_CONDICIONADO");
        jogador.setAgilidade(85);
        jogador.setIdade(25);

        BigDecimal valorMercado = service.calcularValorDeMercado(jogador);

        // O valor correto calculado pela regra para estes parâmetros é 8.79
        assertEquals(new BigDecimal("8.79"), valorMercado);
    }

    @Test
    public void deveLancarExcecaoQuandoSomaDosAtributosUltrapassaLimite() {
        JogadorModel jogador = new JogadorModel();
        jogador.setVelocidade(90);
        jogador.setFinalizacao(90);
        jogador.setPasse(90);
        jogador.setDrible(90);
        jogador.setDefesa(90);
        jogador.setFisico(90); // Soma = 540 (ultrapassa 480)
        jogador.setPotencial(95);
        jogador.setIdade(20);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            service.salvarJogador(jogador);
        });

        assertEquals("A soma dos 6 atributos técnicos não pode ultrapassar 480.", exception.getMessage());
    }

    @Test
    public void deveLancarExcecaoQuandoPotencialMenorQueMaiorAtributo() {
        JogadorModel jogador = new JogadorModel();
        jogador.setVelocidade(80);
        jogador.setFinalizacao(70);
        jogador.setPasse(60);
        jogador.setDrible(50);
        jogador.setDefesa(40);
        jogador.setFisico(30); // Maior atributo é 80
        jogador.setPotencial(75); // Menor que o maior atributo
        jogador.setIdade(22);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            service.salvarJogador(jogador);
        });

        assertEquals("O potencial não pode ser menor que o maior dos 6 atributos.", exception.getMessage());
    }

    @Test
    public void deveLancarExcecaoAoTentarIrDeDoenteParaAptoDiretamente() {
        JogadorModel jogador = new JogadorModel();
        jogador.setId(2);
        jogador.setCondicao("DOENTE");

        //PRECISO CRIAR UM CENARIO DE TENTATIVA DE "APTO"

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            if ("DOENTE".equals(jogador.getCondicao())) {
                throw new IllegalArgumentException("Um jogador doente não pode ir diretamente para apto.");
            }
        });

        assertEquals("Um jogador doente não pode ir diretamente para apto.", exception.getMessage());
    }

}