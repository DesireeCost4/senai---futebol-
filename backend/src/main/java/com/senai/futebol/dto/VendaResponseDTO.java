package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class VendaResponseDTO {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("club_id")
    private Integer clubId;

    @JsonProperty("player_id")
    private Integer playerId;

    @JsonProperty("player_name")
    private String playerName;

    @JsonProperty("type")
    private String type = "VENDA";

    @JsonProperty("value")
    private BigDecimal value;

    @JsonProperty("fee")
    private BigDecimal fee;

    @JsonProperty("penalty")
    private BigDecimal penalty;

    @JsonProperty("profit")
    private BigDecimal profit;

    @JsonProperty("cash_change")
    private BigDecimal cashChange;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("purchase_value")
    private BigDecimal purchaseValue;

    @JsonProperty("remaining_days")
    private Long remainingDays;

    @JsonProperty("penalty_rate")
    private Integer penaltyRate;

    @JsonProperty("contract_status")
    private String contractStatus;

    @JsonProperty("club_cash")
    private BigDecimal clubCash;

    public VendaResponseDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getClubId() { return clubId; }
    public void setClubId(Integer clubId) { this.clubId = clubId; }

    public Integer getPlayerId() { return playerId; }
    public void setPlayerId(Integer playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }

    public BigDecimal getPenalty() { return penalty; }
    public void setPenalty(BigDecimal penalty) { this.penalty = penalty; }

    public BigDecimal getProfit() { return profit; }
    public void setProfit(BigDecimal profit) { this.profit = profit; }

    public BigDecimal getCashChange() { return cashChange; }
    public void setCashChange(BigDecimal cashChange) { this.cashChange = cashChange; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public BigDecimal getPurchaseValue() { return purchaseValue; }
    public void setPurchaseValue(BigDecimal purchaseValue) { this.purchaseValue = purchaseValue; }

    public Long getRemainingDays() { return remainingDays; }
    public void setRemainingDays(Long remainingDays) { this.remainingDays = remainingDays; }

    public Integer getPenaltyRate() { return penaltyRate; }
    public void setPenaltyRate(Integer penaltyRate) { this.penaltyRate = penaltyRate; }

    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }

    public BigDecimal getClubCash() { return clubCash; }
    public void setClubCash(BigDecimal clubCash) { this.clubCash = clubCash; }
}
