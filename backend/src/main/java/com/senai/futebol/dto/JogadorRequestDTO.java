package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JogadorRequestDTO {

    @JsonProperty("name")
    private String name;

    @JsonProperty("position")
    private String position;

    @JsonProperty("agility")
    private Integer agility;

    @JsonProperty("age")
    private Integer age;

    @JsonProperty("pace")
    private Integer pace;

    @JsonProperty("shooting")
    private Integer shooting;

    @JsonProperty("passing")
    private Integer passing;

    @JsonProperty("dribbling")
    private Integer dribbling;

    @JsonProperty("defending")
    private Integer defending;

    @JsonProperty("physical")
    private Integer physical;

    @JsonProperty("potential")
    private Integer potential;

    public JogadorRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Integer getAgility() { return agility; }
    public void setAgility(Integer agility) { this.agility = agility; }

    public Integer getAgilidade() { return agility; }
    public void setAgilidade(Integer agilidade) { this.agility = agilidade; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Integer getPace() { return pace; }
    public void setPace(Integer pace) { this.pace = pace; }

    public Integer getShooting() { return shooting; }
    public void setShooting(Integer shooting) { this.shooting = shooting; }

    public Integer getPassing() { return passing; }
    public void setPassing(Integer passing) { this.passing = passing; }

    public Integer getDribbling() { return dribbling; }
    public void setDribbling(Integer dribbling) { this.dribbling = dribbling; }

    public Integer getDefending() { return defending; }
    public void setDefending(Integer defending) { this.defending = defending; }

    public Integer getPhysical() { return physical; }
    public void setPhysical(Integer physical) { this.physical = physical; }

    public Integer getPotential() { return potential; }
    public void setPotential(Integer potential) { this.potential = potential; }
}
