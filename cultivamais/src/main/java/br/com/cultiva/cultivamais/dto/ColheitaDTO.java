package br.com.cultiva.cultivamais.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ColheitaDTO {

    private double quantidadeColhida;
    private String unidadeMedida;
    private LocalDateTime dataHora;
    private String observacao;
    private String fotoColheita;
    private Long idUsuario;
    private List<InsumoUsadoItem> insumosUsados;

    public static class InsumoUsadoItem {
        private Long idEstoque;
        private String nome;
        private Long quantidade;
        private String unidadeMedida;

        public Long getIdEstoque() { return idEstoque; }
        public void setIdEstoque(Long idEstoque) { this.idEstoque = idEstoque; }
        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public Long getQuantidade() { return quantidade; }
        public void setQuantidade(Long quantidade) { this.quantidade = quantidade; }
        public String getUnidadeMedida() { return unidadeMedida; }
        public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
    }

    public double getQuantidadeColhida() { return quantidadeColhida; }
    public void setQuantidadeColhida(double quantidadeColhida) { this.quantidadeColhida = quantidadeColhida; }
    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public String getFotoColheita() { return fotoColheita; }
    public void setFotoColheita(String fotoColheita) { this.fotoColheita = fotoColheita; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public List<InsumoUsadoItem> getInsumosUsados() { return insumosUsados; }
    public void setInsumosUsados(List<InsumoUsadoItem> insumosUsados) { this.insumosUsados = insumosUsados; }
}
