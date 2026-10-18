package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class ContratoResumoDTO {

    @JsonProperty("purchase_value")
    private BigDecimal purchaseValue;

    @JsonProperty("loyalty_until")
    private String loyaltyUntil;

    @JsonProperty("status")
    private String status;

    public ContratoResumoDTO() {}

    public ContratoResumoDTO(BigDecimal purchaseValue, String loyaltyUntil, String status) {
        this.purchaseValue = purchaseValue;
        this.loyaltyUntil = loyaltyUntil;
        this.status = status;
    }

    public BigDecimal getPurchaseValue() { return purchaseValue; }
    public void setPurchaseValue(BigDecimal purchaseValue) { this.purchaseValue = purchaseValue; }

    public String getLoyaltyUntil() { return loyaltyUntil; }
    public void setLoyaltyUntil(String loyaltyUntil) { this.loyaltyUntil = loyaltyUntil; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
