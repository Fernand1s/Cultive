package br.com.cultiva.cultivamais.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "logs_sistema")
public class LogSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String usuario;
    private String acao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dataHora;

    public LogSistema() {}

    public LogSistema(String usuario, String acao) {
        this.usuario = usuario;
        this.acao = acao;
        this.dataHora = LocalDateTime.now();
    }

    //Getters
    public Long getId() { return id; }
    public String getUsuario() { return usuario; }
    public String getAcao() { return acao; }
    public LocalDateTime getDataHora() { return dataHora; }

    //Setters
    public void setId(Long id) { this.id = id; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public void setAcao(String acao) { this.acao = acao; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}