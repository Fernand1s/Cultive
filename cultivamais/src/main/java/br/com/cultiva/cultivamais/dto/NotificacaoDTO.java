package br.com.cultiva.cultivamais.dto;

import java.time.LocalDateTime;

public class NotificacaoDTO {
    private Long id;
    private Long idUsuario;
    private String titulo;
    private String mensagem;
    private String tipo;
    private LocalDateTime dataHora;
    private boolean lida;

    public NotificacaoDTO() {}

    public NotificacaoDTO(Long id, Long idUsuario, String titulo, String mensagem, String tipo, LocalDateTime dataHora, boolean lida) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.tipo = tipo;
        this.dataHora = dataHora;
        this.lida = lida;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }
}