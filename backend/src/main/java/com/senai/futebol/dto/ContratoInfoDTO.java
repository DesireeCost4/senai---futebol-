package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class ContratoInfoDTO {

    @JsonProperty("purchase_value")
    private BigDecimal purchaseValue;

    @JsonProperty("loyalty_until")
    private String loyaltyUntil;

    @JsonProperty("remaining_days")
    private Long remainingDays;

    @JsonProperty("penalty_rate")
    private Integer penaltyRate;

    public ContratoInfoDTO() {}

    public ContratoInfoDTO(BigDecimal purchaseValue, String loyaltyUntil, Long remainingDays, Integer penaltyRate) {
        this.purchaseValue = purchaseValue;
        this.loyaltyUntil = loyaltyUntil;
        this.remainingDays = remainingDays;
        this.penaltyRate = penaltyRate;
    }

    public BigDecimal getPurchaseValue() { return purchaseValue; }
    public void setPurchaseValue(BigDecimal purchaseValue) { this.purchaseValue = purchaseValue; }

    public String getLoyaltyUntil() { return loyaltyUntil; }
    public void setLoyaltyUntil(String loyaltyUntil) { this.loyaltyUntil = loyaltyUntil; }

    public Long getRemainingDays() { return remainingDays; }
    public void setRemainingDays(Long remainingDays) { this.remainingDays = remainingDays; }

    public Integer getPenaltyRate() { return penaltyRate; }
    public void setPenaltyRate(Integer penaltyRate) { this.penaltyRate = penaltyRate; }
}
