package br.com.cultiva.cultivamais.dto;

public class EstoqueDTO {

    private Long idEstoque;
    private String nome;
    private String sku;
    private String categoria;
    private String subcategoria;
    private String marca;
    private String modelo;
    private String fornecedor;
    private String codigoIdentificador;
    private String dataAquisicao;
    private Double valorCompra;
    private String unidadeMedida;
    private String localizacao;
    private String status;
    private String fotoPreview;

    // Insumos
    private String validade;
    private String principioAtivo;
    private Long estoqueMinimo;
    private Long quantidadeEstoque;

    // Maquinários
    private Double horimetroAtual;
    private String horasRevisao;
    private String tipoCombustivel;
    private String placa;

    // Equipamentos
    private String capacidadeTrabalho;
    private String compatibilidadePotencia;

    public EstoqueDTO() {}

    public Long getIdEstoque() { return idEstoque; }
    public void setIdEstoque(Long idEstoque) { this.idEstoque = idEstoque; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getSubcategoria() { return subcategoria; }
    public void setSubcategoria(String subcategoria) { this.subcategoria = subcategoria; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public String getFornecedor() { return fornecedor; }
    public void setFornecedor(String fornecedor) { this.fornecedor = fornecedor; }

    public String getCodigoIdentificador() { return codigoIdentificador; }
    public void setCodigoIdentificador(String codigoIdentificador) { this.codigoIdentificador = codigoIdentificador; }

    public String getDataAquisicao() { return dataAquisicao; }
    public void setDataAquisicao(String dataAquisicao) { this.dataAquisicao = dataAquisicao; }

    public Double getValorCompra() { return valorCompra; }
    public void setValorCompra(Double valorCompra) { this.valorCompra = valorCompra; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public String getLocalizacao() { return localizacao; }
    public void setLocalizacao(String localizacao) { this.localizacao = localizacao; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFotoPreview() { return fotoPreview; }
    public void setFotoPreview(String fotoPreview) { this.fotoPreview = fotoPreview; }

    public String getValidade() { return validade; }
    public void setValidade(String validade) { this.validade = validade; }

    public String getPrincipioAtivo() { return principioAtivo; }
    public void setPrincipioAtivo(String principioAtivo) { this.principioAtivo = principioAtivo; }

    public Long getEstoqueMinimo() { return estoqueMinimo; }
    public void setEstoqueMinimo(Long estoqueMinimo) { this.estoqueMinimo = estoqueMinimo; }

    public Long getQuantidadeEstoque() { return quantidadeEstoque; }
    public void setQuantidadeEstoque(Long quantidadeEstoque) { this.quantidadeEstoque = quantidadeEstoque; }

    public Double getHorimetroAtual() { return horimetroAtual; }
    public void setHorimetroAtual(Double horimetroAtual) { this.horimetroAtual = horimetroAtual; }

    public String getHorasRevisao() { return horasRevisao; }
    public void setHorasRevisao(String horasRevisao) { this.horasRevisao = horasRevisao; }

    public String getTipoCombustivel() { return tipoCombustivel; }
    public void setTipoCombustivel(String tipoCombustivel) { this.tipoCombustivel = tipoCombustivel; }

    public String getPlaca() { return placa; }
    public void setPlaca(String placa) { this.placa = placa; }

    public String getCapacidadeTrabalho() { return capacidadeTrabalho; }
    public void setCapacidadeTrabalho(String capacidadeTrabalho) { this.capacidadeTrabalho = capacidadeTrabalho; }

    public String getCompatibilidadePotencia() { return compatibilidadePotencia; }
    public void setCompatibilidadePotencia(String compatibilidadePotencia) { this.compatibilidadePotencia = compatibilidadePotencia; }
}