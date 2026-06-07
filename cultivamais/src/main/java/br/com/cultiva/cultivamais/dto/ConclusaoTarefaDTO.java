package br.com.cultiva.cultivamais.dto;

import java.util.List;

public class ConclusaoTarefaDTO {

    private String observacao;
    private String fotoConclusao;
    private List<InsumoUsadoDTO> insumosUsados;

    public static class InsumoUsadoDTO {
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

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public String getFotoConclusao() { return fotoConclusao; }
    public void setFotoConclusao(String fotoConclusao) { this.fotoConclusao = fotoConclusao; }
    public List<InsumoUsadoDTO> getInsumosUsados() { return insumosUsados; }
    public void setInsumosUsados(List<InsumoUsadoDTO> insumosUsados) { this.insumosUsados = insumosUsados; }
}
