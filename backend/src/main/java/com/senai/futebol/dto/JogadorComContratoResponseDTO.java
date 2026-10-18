package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class JogadorComContratoResponseDTO extends JogadorResponseDTO {

    @JsonProperty("contract")
    private ContratoInfoDTO contract;

    public JogadorComContratoResponseDTO() {
        super();
    }

    public ContratoInfoDTO getContract() { return contract; }
    public void setContract(ContratoInfoDTO contract) { this.contract = contract; }
}
