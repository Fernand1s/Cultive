package br.com.cultiva.cultivamais.dto;

public class ColheitaResumoDTO {
    private String dataHora;
    private Double quantidade;
    private String unidadeMedida;
    private String observacao;

    public ColheitaResumoDTO() {}

    public ColheitaResumoDTO(String dataHora, Double quantidade, String unidadeMedida, String observacao) {
        this.dataHora = dataHora;
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
        this.observacao = observacao;
    }

    public String getDataHora() { return dataHora; }
    public void setDataHora(String dataHora) { this.dataHora = dataHora; }

    public Double getQuantidade() { return quantidade; }
    public void setQuantidade(Double quantidade) { this.quantidade = quantidade; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
