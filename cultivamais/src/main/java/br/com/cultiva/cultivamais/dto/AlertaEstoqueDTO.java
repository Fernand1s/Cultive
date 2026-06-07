package br.com.cultiva.cultivamais.dto;

public class AlertaEstoqueDTO {
    private Long idEstoque;
    private String nome;
    private String categoria;
    private String subcategoria;
    private Long quantidadeAtual;
    private Long estoqueMinimo;
    private Long deficit;
    private String situacao;
    private String unidadeMedida;
    private String validade;

    public AlertaEstoqueDTO() {}

    public AlertaEstoqueDTO(Long idEstoque, String nome, String categoria, String subcategoria,
                             Long quantidadeAtual, Long estoqueMinimo, Long deficit,
                             String situacao, String unidadeMedida, String validade) {
        this.idEstoque = idEstoque;
        this.nome = nome;
        this.categoria = categoria;
        this.subcategoria = subcategoria;
        this.quantidadeAtual = quantidadeAtual;
        this.estoqueMinimo = estoqueMinimo;
        this.deficit = deficit;
        this.situacao = situacao;
        this.unidadeMedida = unidadeMedida;
        this.validade = validade;
    }

    public Long getIdEstoque() { return idEstoque; }
    public void setIdEstoque(Long idEstoque) { this.idEstoque = idEstoque; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getSubcategoria() { return subcategoria; }
    public void setSubcategoria(String subcategoria) { this.subcategoria = subcategoria; }

    public Long getQuantidadeAtual() { return quantidadeAtual; }
    public void setQuantidadeAtual(Long quantidadeAtual) { this.quantidadeAtual = quantidadeAtual; }

    public Long getEstoqueMinimo() { return estoqueMinimo; }
    public void setEstoqueMinimo(Long estoqueMinimo) { this.estoqueMinimo = estoqueMinimo; }

    public Long getDeficit() { return deficit; }
    public void setDeficit(Long deficit) { this.deficit = deficit; }

    public String getSituacao() { return situacao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public String getValidade() { return validade; }
    public void setValidade(String validade) { this.validade = validade; }
}
