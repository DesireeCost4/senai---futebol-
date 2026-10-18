package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PartidaClubResumoDTO {

    @JsonProperty("club_id")
    private Integer clubId;

    @JsonProperty("club_name")
    private String clubName;

    @JsonProperty("formation")
    private String formation;

    @JsonProperty("goals")
    private Integer goals;

    public PartidaClubResumoDTO() {}

    public PartidaClubResumoDTO(Integer clubId, String clubName, String formation, Integer goals) {
        this.clubId = clubId;
        this.clubName = clubName;
        this.formation = formation;
        this.goals = goals;
    }

    public Integer getClubId() { return clubId; }
    public void setClubId(Integer clubId) { this.clubId = clubId; }

    public String getClubName() { return clubName; }
    public void setClubName(String clubName) { this.clubName = clubName; }

    public String getFormation() { return formation; }
    public void setFormation(String formation) { this.formation = formation; }

    public Integer getGoals() { return goals; }
    public void setGoals(Integer goals) { this.goals = goals; }
}
