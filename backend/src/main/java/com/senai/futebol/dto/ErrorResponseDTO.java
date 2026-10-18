package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ErrorResponseDTO {

    @JsonProperty("message")
    private String message;

    public ErrorResponseDTO() {}

    public ErrorResponseDTO(String message) {
        this.message = message;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
