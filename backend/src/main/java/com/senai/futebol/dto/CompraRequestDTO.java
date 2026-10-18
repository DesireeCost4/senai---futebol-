package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CompraRequestDTO {

    @JsonProperty("club_id")
    private Integer clubId;

    @JsonProperty("loyalty_until")
    private String loyaltyUntil;

    public CompraRequestDTO() {}

    public CompraRequestDTO(Integer clubId, String loyaltyUntil) {
        this.clubId = clubId;
        this.loyaltyUntil = loyaltyUntil;
    }

    public Integer getClubId() { return clubId; }
    public void setClubId(Integer clubId) { this.clubId = clubId; }

    public String getLoyaltyUntil() { return loyaltyUntil; }
    public void setLoyaltyUntil(String loyaltyUntil) { this.loyaltyUntil = loyaltyUntil; }
}
