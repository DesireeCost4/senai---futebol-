package com.senai.futebol.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(RecursoNotFoundException ex, HttpServletRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Recurso não encontrado no sistema");
        body.put("path", request.getRequestURI());

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }
}
