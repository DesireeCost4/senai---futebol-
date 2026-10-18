package com.senai.futebol.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.NOT_FOUND, reason = "Recurso não encontrado no sistema")
public class RecursoNotFoundException extends RuntimeException {

    public RecursoNotFoundException(String message) {
        super(message);
    }
}
