package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DuelPlayerDTO {

    @JsonProperty("player_id")
    private Integer playerId;

    @JsonProperty("player_name")
    private String playerName;

    @JsonProperty("position")
    private String position;

    @JsonProperty("condition")
    private String condition;

    @JsonProperty("attribute")
    private String attribute;

    @JsonProperty("value")
    private Integer value;

    public DuelPlayerDTO() {}

    public DuelPlayerDTO(Integer playerId, String playerName, String position, String condition, String attribute, Integer value) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.position = position;
        this.condition = condition;
        this.attribute = attribute;
        this.value = value;
    }

    public Integer getPlayerId() { return playerId; }
    public void setPlayerId(Integer playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getAttribute() { return attribute; }
    public void setAttribute(String attribute) { this.attribute = attribute; }

    public Integer getValue() { return value; }
    public void setValue(Integer value) { this.value = value; }
}
