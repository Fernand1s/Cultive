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

    private String subcategoria;
    private String informacoesExtras;

    private boolean isConcluida;
    private boolean cancelada;
    private boolean emObservacao;
    private String observacaoConclusao;
    private String fotoConclusao;
    private java.util.List<InsumoUsadoDTO> insumosUsados;

    private Long idArea;
    private Long idCultivo;
    private String nomeArea;
    private String nomeCultivo;

    private UsuarioResumo responsavel;
    private UsuarioResumo criador;

    public static class InsumoUsadoDTO {
        private Long idEstoque;
        private String nome;
        private Long quantidade;
        private String unidadeMedida;

        public InsumoUsadoDTO() {}
        public Long getIdEstoque() { return idEstoque; }
        public void setIdEstoque(Long idEstoque) { this.idEstoque = idEstoque; }
        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public Long getQuantidade() { return quantidade; }
        public void setQuantidade(Long quantidade) { this.quantidade = quantidade; }
        public String getUnidadeMedida() { return unidadeMedida; }
        public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
    }

    public static class UsuarioResumo {
        private Long idUsuario;
        private String nomeUsuario;

        public UsuarioResumo() {}

        public UsuarioResumo(Long idUsuario, String nomeUsuario) {
            this.idUsuario = idUsuario;
            this.nomeUsuario = nomeUsuario;
        }

        public Long getIdUsuario() { return idUsuario; }
        public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
        public String getNomeUsuario() { return nomeUsuario; }
        public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
    }

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public Prioridade getPrioridade() { return prioridade; }
    public void setPrioridade(Prioridade prioridade) { this.prioridade = prioridade; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public LocalDateTime getDataPrazo() { return dataPrazo; }
    public void setDataPrazo(LocalDateTime dataPrazo) { this.dataPrazo = dataPrazo; }

    public StatusTarefa getStatus() { return status; }
    public void setStatus(StatusTarefa status) { this.status = status; }

    public Long getIdResponsavel() { return idResponsavel; }
    public void setIdResponsavel(Long idResponsavel) { this.idResponsavel = idResponsavel; }

    public boolean isConcluida() { return isConcluida; }
    public void setConcluida(boolean concluida) { isConcluida = concluida; }

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
    public java.util.List<InsumoUsadoDTO> getInsumosUsados() { return insumosUsados; }
    public void setInsumosUsados(java.util.List<InsumoUsadoDTO> insumosUsados) { this.insumosUsados = insumosUsados; }

    public UsuarioResumo getResponsavel() { return responsavel; }
    public void setResponsavel(UsuarioResumo responsavel) { this.responsavel = responsavel; }
    public UsuarioResumo getCriador() { return criador; }
    public void setCriador(UsuarioResumo criador) { this.criador = criador; }

    public Long getIdArea() { return idArea; }
    public void setIdArea(Long idArea) { this.idArea = idArea; }
    public Long getIdCultivo() { return idCultivo; }
    public void setIdCultivo(Long idCultivo) { this.idCultivo = idCultivo; }
    public String getNomeArea() { return nomeArea; }
    public void setNomeArea(String nomeArea) { this.nomeArea = nomeArea; }
    public String getNomeCultivo() { return nomeCultivo; }
    public void setNomeCultivo(String nomeCultivo) { this.nomeCultivo = nomeCultivo; }
}