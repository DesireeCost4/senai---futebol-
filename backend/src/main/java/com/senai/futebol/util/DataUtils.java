package com.senai.futebol.util;

import com.senai.futebol.exception.ValidacaoException;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.regex.Pattern;

public class DataUtils {

    public static final ZoneId BRASILIA_ZONE = ZoneOffset.of("-03:00");
    private static final DateTimeFormatter RESPOSTA_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX").withZone(BRASILIA_ZONE);
    private static final Pattern FORMATO_ENTRADA_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}-03:00$");

    public static String formatarBrasilia(Instant instant) {
        if (instant == null) return null;
        return RESPOSTA_FORMATTER.format(instant);
    }

    public static Instant parsearDataEntrada(String dataTexto) {
        if (dataTexto == null || dataTexto.isBlank()) {
            throw new ValidacaoException("Data e hora obrigatória.");
        }

        if (!FORMATO_ENTRADA_PATTERN.matcher(dataTexto).matches()) {
            throw new ValidacaoException("Data e hora deve estar no formato AAAA-MM-DDTHH:MM-03:00.");
        }

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mmXXX")
                    .withResolverStyle(ResolverStyle.STRICT);
            OffsetDateTime odt = OffsetDateTime.parse(dataTexto, formatter);
            return odt.toInstant();
        } catch (DateTimeParseException e) {
            throw new ValidacaoException("Data ou hora inválida ou inexistente: " + dataTexto);
        }
    }
}
