package com.senai.futebol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class HistoricoTransacoesResponseDTO {

    @JsonProperty("data")
    private List<TransacaoResponseDTO> data;

    @JsonProperty("summary")
    private TransacoesSummaryDTO summary;

    public HistoricoTransacoesResponseDTO() {}

    public HistoricoTransacoesResponseDTO(List<TransacaoResponseDTO> data, TransacoesSummaryDTO summary) {
        this.data = data;
        this.summary = summary;
    }

    public List<TransacaoResponseDTO> getData() { return data; }
    public void setData(List<TransacaoResponseDTO> data) { this.data = data; }

    public TransacoesSummaryDTO getSummary() { return summary; }
    public void setSummary(TransacoesSummaryDTO summary) { this.summary = summary; }
}
