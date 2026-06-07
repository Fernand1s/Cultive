package br.com.cultiva.cultivamais.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Tarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String descricao;

    @Enumerated(EnumType.STRING)
    private Prioridade prioridade;

    private String categoria;
    private LocalDateTime dataPrazo;

    private String subcategoria;

    @Column(columnDefinition = "TEXT")
    private String informacoesExtras;

    private boolean concluida;
    private boolean cancelada = false;
    private boolean emObservacao = false;
    private String observacaoConclusao;

    @Column(columnDefinition = "TEXT")
    private String fotoConclusao;

    @Column(columnDefinition = "TEXT")
    private String insumosUsadosJson;

    private LocalDateTime dataCriacao;
    private LocalDateTime dataConclusao;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "responsavel_id")
    @JsonIgnoreProperties({"tarefasAtribuidas", "tarefasCriadas", "senha"})
    private Usuario responsavel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "criador_id")
    @JsonIgnoreProperties({"tarefasAtribuidas", "tarefasCriadas", "senha", "hibernateLazyInitializer", "handler"})
    private Usuario criador;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "area_cultivo_id", nullable = true)
    @JsonIgnore
    private AreaCultivo areaCultivo;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "cultivo_id", nullable = true)
    @JsonIgnore
    private Cultivo cultivo;

    public Tarefa() {}

    public StatusTarefa getStatus() {
        if (this.cancelada) return StatusTarefa.CANCELADA;
        if (this.concluida) return StatusTarefa.CONCLUIDA;
        if (this.emObservacao) return StatusTarefa.EM_OBSERVACAO;
        return StatusTarefa.PENDENTE;
    }

    // Getters e Setters
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

    public boolean isConcluida() {
        return concluida;
    }

    public void setConcluida(boolean concluida) {
        this.concluida = concluida;
    }

    public String getSubcategoria() { return subcategoria; }
    public void setSubcategoria(String subcategoria) { this.subcategoria = subcategoria; }

    public String getInformacoesExtras() { return informacoesExtras; }
    public void setInformacoesExtras(String informacoesExtras) { this.informacoesExtras = informacoesExtras; }

    public boolean isCancelada() { return cancelada; }
    public void setCancelada(boolean cancelada) { this.cancelada = cancelada; }

    public boolean isEmObservacao() { return emObservacao; }
    public void setEmObservacao(boolean emObservacao) { this.emObservacao = emObservacao; }

    public String getObservacaoConclusao() { return observacaoConclusao; }
    public void setObservacaoConclusao(String observacaoConclusao) { this.observacaoConclusao = observacaoConclusao; }

    public String getFotoConclusao() { return fotoConclusao; }
    public void setFotoConclusao(String fotoConclusao) { this.fotoConclusao = fotoConclusao; }

    public String getInsumosUsadosJson() { return insumosUsadosJson; }
    public void setInsumosUsadosJson(String insumosUsadosJson) { this.insumosUsadosJson = insumosUsadosJson; }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public LocalDateTime getDataConclusao() {
        return dataConclusao;
    }

    public void setDataConclusao(LocalDateTime dataConclusao) {
        this.dataConclusao = dataConclusao;
    }

    public Usuario getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(Usuario responsavel) {
        this.responsavel = responsavel;
    }

    public Usuario getCriador() {
        return criador;
    }

    public void setCriador(Usuario criador) {
        this.criador = criador;
    }

    public AreaCultivo getAreaCultivo() { return areaCultivo; }
    public void setAreaCultivo(AreaCultivo areaCultivo) { this.areaCultivo = areaCultivo; }

    public Cultivo getCultivo() { return cultivo; }
    public void setCultivo(Cultivo cultivo) { this.cultivo = cultivo; }
}