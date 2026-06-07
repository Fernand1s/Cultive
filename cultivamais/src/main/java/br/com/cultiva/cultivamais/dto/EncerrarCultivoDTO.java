package br.com.cultiva.cultivamais.dto;

import java.time.LocalDate;

public class EncerrarCultivoDTO {
    private LocalDate dataEncerramento;
    private String motivoEncerramento;
    private Long idUsuario;

    public LocalDate getDataEncerramento() { return dataEncerramento; }
    public void setDataEncerramento(LocalDate dataEncerramento) { this.dataEncerramento = dataEncerramento; }
    public String getMotivoEncerramento() { return motivoEncerramento; }
    public void setMotivoEncerramento(String motivoEncerramento) { this.motivoEncerramento = motivoEncerramento; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
}
