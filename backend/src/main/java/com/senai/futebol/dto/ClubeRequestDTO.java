package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ClubeRequestDTO {

    @JsonProperty("name")
    private String name;

    @JsonProperty("acronym")
    private String acronym;

    public ClubeRequestDTO() {}

    public ClubeRequestDTO(String name, String acronym) {
        this.name = name;
        this.acronym = acronym;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAcronym() { return acronym; }
    public void setAcronym(String acronym) { this.acronym = acronym; }
}
