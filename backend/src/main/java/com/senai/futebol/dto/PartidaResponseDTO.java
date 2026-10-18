package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PartidaResponseDTO {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("played_at")
    private String playedAt;

    @JsonProperty("home")
    private PartidaClubResumoDTO home;

    @JsonProperty("away")
    private PartidaClubResumoDTO away;

    @JsonProperty("result")
    private String result;

    @JsonProperty("duels")
    private List<DueloResponseDTO> duels;

    public PartidaResponseDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getPlayedAt() { return playedAt; }
    public void setPlayedAt(String playedAt) { this.playedAt = playedAt; }

    public PartidaClubResumoDTO getHome() { return home; }
    public void setHome(PartidaClubResumoDTO home) { this.home = home; }

    public PartidaClubResumoDTO getAway() { return away; }
    public void setAway(PartidaClubResumoDTO away) { this.away = away; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public List<DueloResponseDTO> getDuels() { return duels; }
    public void setDuels(List<DueloResponseDTO> duels) { this.duels = duels; }
}
