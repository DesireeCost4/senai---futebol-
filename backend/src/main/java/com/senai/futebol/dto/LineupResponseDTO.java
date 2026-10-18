package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class LineupResponseDTO {

    @JsonProperty("club_id")
    private Integer clubId;

    @JsonProperty("formation")
    private String formation;

    @JsonProperty("complete")
    private Boolean complete;

    @JsonProperty("players")
    private List<JogadorResponseDTO> players;

    public LineupResponseDTO() {}

    public LineupResponseDTO(Integer clubId, String formation, Boolean complete, List<JogadorResponseDTO> players) {
        this.clubId = clubId;
        this.formation = formation;
        this.complete = complete;
        this.players = players;
    }

    public Integer getClubId() { return clubId; }
    public void setClubId(Integer clubId) { this.clubId = clubId; }

    public String getFormation() { return formation; }
    public void setFormation(String formation) { this.formation = formation; }

    public Boolean getComplete() { return complete; }
    public void setComplete(Boolean complete) { this.complete = complete; }

    public List<JogadorResponseDTO> getPlayers() { return players; }
    public void setPlayers(List<JogadorResponseDTO> players) { this.players = players; }
}
