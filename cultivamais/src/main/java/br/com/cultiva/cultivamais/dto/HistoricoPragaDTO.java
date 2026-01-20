package br.com.cultiva.cultivamais.dto;

import java.time.LocalDateTime;
import java.util.List;

public class HistoricoPragaDTO {
    private String nomePraga;
    private String nivel;
    private LocalDateTime data;
    private String observacao;

    public HistoricoPragaDTO() {
    }

    public HistoricoPragaDTO(String nomePraga, String nivel, LocalDateTime data, String observacao) {
        this.nomePraga = nomePraga;
        this.nivel = nivel;
        this.data = data;
        this.observacao = observacao;
    }

    public String getNomePraga() {
        return nomePraga;
    }

    public void setNomePraga(String nomePraga) {
        this.nomePraga = nomePraga;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public LocalDateTime getData() {
        return data;
    }

    public void setData(LocalDateTime data) {
        this.data = data;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }
}