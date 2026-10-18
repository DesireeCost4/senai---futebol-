package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class TransacoesSummaryDTO {

    @JsonProperty("total_spent")
    private BigDecimal totalSpent = BigDecimal.ZERO.setScale(2);

    @JsonProperty("total_received")
    private BigDecimal totalReceived = BigDecimal.ZERO.setScale(2);

    @JsonProperty("total_fees")
    private BigDecimal totalFees = BigDecimal.ZERO.setScale(2);

    @JsonProperty("total_penalties")
    private BigDecimal totalPenalties = BigDecimal.ZERO.setScale(2);

    @JsonProperty("total_profit")
    private BigDecimal totalProfit = BigDecimal.ZERO.setScale(2);

    public TransacoesSummaryDTO() {}

    public TransacoesSummaryDTO(BigDecimal totalSpent, BigDecimal totalReceived, BigDecimal totalFees, BigDecimal totalPenalties, BigDecimal totalProfit) {
        this.totalSpent = totalSpent;
        this.totalReceived = totalReceived;
        this.totalFees = totalFees;
        this.totalPenalties = totalPenalties;
        this.totalProfit = totalProfit;
    }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public BigDecimal getTotalReceived() { return totalReceived; }
    public void setTotalReceived(BigDecimal totalReceived) { this.totalReceived = totalReceived; }

    public BigDecimal getTotalFees() { return totalFees; }
    public void setTotalFees(BigDecimal totalFees) { this.totalFees = totalFees; }

    public BigDecimal getTotalPenalties() { return totalPenalties; }
    public void setTotalPenalties(BigDecimal totalPenalties) { this.totalPenalties = totalPenalties; }

    public BigDecimal getTotalProfit() { return totalProfit; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }
}
