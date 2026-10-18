package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DueloResponseDTO {

    @JsonProperty("order")
    private Integer order;

    @JsonProperty("attacking_club_id")
    private Integer attackingClubId;

    @JsonProperty("attacker")
    private DuelPlayerDTO attacker;

    @JsonProperty("defender")
    private DuelPlayerDTO defender;

    @JsonProperty("goal")
    private Boolean goal;

    public DueloResponseDTO() {}

    public DueloResponseDTO(Integer order, Integer attackingClubId, DuelPlayerDTO attacker, DuelPlayerDTO defender, Boolean goal) {
        this.order = order;
        this.attackingClubId = attackingClubId;
        this.attacker = attacker;
        this.defender = defender;
        this.goal = goal;
    }

    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }

    public Integer getAttackingClubId() { return attackingClubId; }
    public void setAttackingClubId(Integer attackingClubId) { this.attackingClubId = attackingClubId; }

    public DuelPlayerDTO getAttacker() { return attacker; }
    public void setAttacker(DuelPlayerDTO attacker) { this.attacker = attacker; }

    public DuelPlayerDTO getDefender() { return defender; }
    public void setDefender(DuelPlayerDTO defender) { this.defender = defender; }

    public Boolean getGoal() { return goal; }
    public void setGoal(Boolean goal) { this.goal = goal; }
}
