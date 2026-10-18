package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JogadorUpdateRequestDTO {

    @JsonProperty("name")
    private String name;

    @JsonProperty("position")
    private String position;

    @JsonProperty("agility")
    private Integer agility;

    @JsonProperty("age")
    private Integer age;

    public JogadorUpdateRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Integer getAgility() { return agility; }
    public void setAgility(Integer agility) { this.agility = agility; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
