package br.com.cultiva.cultivamais.dto;

import java.time.LocalDateTime;

public class LogResponseDTO {
    private Long id;
    private String usuario;
    private String acao;
    private LocalDateTime dataHora;

    public LogResponseDTO() {
    }

    public LogResponseDTO(Long id, String usuario, String acao, LocalDateTime dataHora) {
        this.id = id;
        this.usuario = usuario;
        this.acao = acao;
        this.dataHora = dataHora;
    }

    public Long getId() {
        return id;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getAcao() {
        return acao;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }
}