package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchRequestDTO {

    @JsonProperty("home_club_id")
    private Integer homeClubId;

    @JsonProperty("away_club_id")
    private Integer awayClubId;

    public MatchRequestDTO() {}

    public MatchRequestDTO(Integer homeClubId, Integer awayClubId) {
        this.homeClubId = homeClubId;
        this.awayClubId = awayClubId;
    }

    public Integer getHomeClubId() { return homeClubId; }
    public void setHomeClubId(Integer homeClubId) { this.homeClubId = homeClubId; }

    public Integer getAwayClubId() { return awayClubId; }
    public void setAwayClubId(Integer awayClubId) { this.awayClubId = awayClubId; }
}
