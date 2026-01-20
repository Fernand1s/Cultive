package br.com.cultiva.cultivamais.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class EventoBaseDTO {

    @NotNull
    private Long idUsuario;
    private String observacao;
    private LocalDateTime dataHora;

    public EventoBaseDTO() {}

    public EventoBaseDTO(Long idUsuario, LocalDateTime dataHora, String observacao) {
        this.idUsuario = idUsuario;
        this.dataHora = dataHora;
        this.observacao = observacao;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }
}
