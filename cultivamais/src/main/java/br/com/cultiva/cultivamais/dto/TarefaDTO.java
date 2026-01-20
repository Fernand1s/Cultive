package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.Prioridade;
import br.com.cultiva.cultivamais.model.StatusTarefa;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class TarefaDTO {

    private Long id;

    @NotBlank(message = "O título é obrigatório")
    private String titulo;

    private String descricao;

    @NotNull(message = "A prioridade é obrigatória")
    private Prioridade prioridade;

    private String categoria;

    @NotNull(message = "O prazo é obrigatório")
    private LocalDateTime dataPrazo;

    private StatusTarefa status;

    @NotNull(message = "O responsável é obrigatório")
    private Long idResponsavel;

    private boolean isConcluida;

    public TarefaDTO() {}

    public TarefaDTO(Long id, String titulo, String descricao, Prioridade prioridade,
                     String categoria, LocalDateTime dataPrazo, StatusTarefa status, Long idResponsavel) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.prioridade = prioridade;
        this.categoria = categoria;
        this.dataPrazo = dataPrazo;
        this.status = status;
        this.idResponsavel = idResponsavel;
        this.isConcluida = false;
    }

    // Getters e Setters ...
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Prioridade getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(Prioridade prioridade) {
        this.prioridade = prioridade;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public LocalDateTime getDataPrazo() {
        return dataPrazo;
    }

    public void setDataPrazo(LocalDateTime dataPrazo) {
        this.dataPrazo = dataPrazo;
    }

    public StatusTarefa getStatus() {
        return status;
    }

    public void setStatus(StatusTarefa status) {
        this.status = status;
    }

    public Long getIdResponsavel() {
        return idResponsavel;
    }

    public void setIdResponsavel(Long idResponsavel) {
        this.idResponsavel = idResponsavel;
    }

    public boolean isConcluida() {
        return isConcluida;
    }

    public void setConcluida(boolean concluida) {
        isConcluida = concluida;
    }
}