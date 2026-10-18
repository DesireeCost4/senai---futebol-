package com.senai.futebol.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class TextoUtils {

    private static final Pattern ESPACOS_REPETIDOS = Pattern.compile("\\s+");
    private static final Pattern CONTEM_DIGITOS = Pattern.compile(".*\\d.*");

    public static String limparEspacos(String texto) {
        if (texto == null) return null;
        String limpo = ESPACOS_REPETIDOS.matcher(texto.trim()).replaceAll(" ");
        return limpo;
    }

    public static String normalizar(String texto) {
        if (texto == null) return "";
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }

    public static boolean temCaracteresDeControle(String texto) {
        if (texto == null) return false;
        for (char c : texto.toCharArray()) {
            if (Character.isISOControl(c)) {
                return true;
            }
        }
        return false;
    }

    public static boolean validarNomeJogador(String nome) {
        if (nome == null) return false;
        String limpo = limparEspacos(nome);
        if (limpo.length() < 3 || limpo.length() > 100) return false;
        if (CONTEM_DIGITOS.matcher(limpo).matches()) return false;
        String[] palavras = limpo.split(" ");
        return palavras.length >= 2;
    }

    public static boolean validarNomeClube(String nome) {
        if (nome == null) return false;
        String limpo = limparEspacos(nome);
        if (limpo.length() < 3 || limpo.length() > 60) return false;
        String[] palavras = limpo.split(" ");
        if (palavras.length < 2 || palavras.length > 5) return false;

        // só letras (com ou sem acento), espaços, hífen e ponto
        return limpo.matches("^[\\p{L}\\s\\-\\.]+$");
    }

    public static boolean validarSiglaClube(String sigla, String nomeClube) {
        if (sigla == null || nomeClube == null) return false;
        if (!sigla.matches("^[A-Z]{3}$")) return false;

        // Três letras não podem ser todas iguais
        if (sigla.charAt(0) == sigla.charAt(1) && sigla.charAt(1) == sigla.charAt(2)) {
            return false;
        }

        String nomeNorm = normalizar(limparEspacos(nomeClube));
        String siglaNorm = sigla.toLowerCase();

        // A primeira letra deve ser a primeira letra do nome
        if (nomeNorm.charAt(0) != siglaNorm.charAt(0)) {
            return false;
        }

        // As três letras devem aparecer no nome nessa ordem
        int idx = 0;
        for (int i = 0; i < siglaNorm.length(); i++) {
            char c = siglaNorm.charAt(i);
            idx = nomeNorm.indexOf(c, idx);
            if (idx == -1) {
                return false;
            }
            idx++; // avança para a próxima busca
        }

        return true;
    }
}
