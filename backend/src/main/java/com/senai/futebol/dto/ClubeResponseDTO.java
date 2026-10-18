package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClubeResponseDTO {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("acronym")
    private String acronym;

    @JsonProperty("cash")
    private BigDecimal cash;

    @JsonProperty("squad_value")
    private BigDecimal squadValue;

    @JsonProperty("net_worth")
    private BigDecimal netWorth;

    @JsonProperty("players")
    private List<JogadorComContratoResponseDTO> players;

    public ClubeResponseDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAcronym() { return acronym; }
    public void setAcronym(String acronym) { this.acronym = acronym; }

    public BigDecimal getCash() { return cash; }
    public void setCash(BigDecimal cash) { this.cash = cash; }

    public BigDecimal getSquadValue() { return squadValue; }
    public void setSquadValue(BigDecimal squadValue) { this.squadValue = squadValue; }

    public BigDecimal getNetWorth() { return netWorth; }
    public void setNetWorth(BigDecimal netWorth) { this.netWorth = netWorth; }

    public List<JogadorComContratoResponseDTO> getPlayers() { return players; }
    public void setPlayers(List<JogadorComContratoResponseDTO> players) { this.players = players; }
}
