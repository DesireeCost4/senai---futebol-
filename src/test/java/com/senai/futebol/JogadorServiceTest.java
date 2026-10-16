package com.senai.futebol;

import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.service.JogadorService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

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
}