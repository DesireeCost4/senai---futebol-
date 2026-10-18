package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JogadorConditionRequestDTO {

    @JsonProperty("condition")
    private String condition;

    public JogadorConditionRequestDTO() {}

    public JogadorConditionRequestDTO(String condition) {
        this.condition = condition;
    }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
}
