package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LineupRequestDTO {

    @JsonProperty("formation")
    private String formation;

    @JsonProperty("player_ids")
    private List<Integer> playerIds;

    public LineupRequestDTO() {}

    public LineupRequestDTO(String formation, List<Integer> playerIds) {
        this.formation = formation;
        this.playerIds = playerIds;
    }

    public String getFormation() { return formation; }
    public void setFormation(String formation) { this.formation = formation; }

    public List<Integer> getPlayerIds() { return playerIds; }
    public void setPlayerIds(List<Integer> playerIds) { this.playerIds = playerIds; }
}
