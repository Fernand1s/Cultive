package br.com.cultiva.cultivamais.dto;

public class ProdutividadeDTO {
    private Long idCultivo;
    private String nomePlanta;
    private String nomeArea;
    private Double tamanhoArea;
    private Double quantidadeColhida;
    private String unidadeMedida;
    private Double produtividadeKgHa;
    private String dataPlantio;
    private String dataEncerramento;
    private String statusCultivo;
    private String estadoPlanta;

    public ProdutividadeDTO() {}

    public ProdutividadeDTO(Long idCultivo, String nomePlanta, String nomeArea, Double tamanhoArea,
                             Double quantidadeColhida, String unidadeMedida, Double produtividadeKgHa,
                             String dataPlantio, String dataEncerramento, String statusCultivo, String estadoPlanta) {
        this.idCultivo = idCultivo;
        this.nomePlanta = nomePlanta;
        this.nomeArea = nomeArea;
        this.tamanhoArea = tamanhoArea;
        this.quantidadeColhida = quantidadeColhida;
        this.unidadeMedida = unidadeMedida;
        this.produtividadeKgHa = produtividadeKgHa;
        this.dataPlantio = dataPlantio;
        this.dataEncerramento = dataEncerramento;
        this.statusCultivo = statusCultivo;
        this.estadoPlanta = estadoPlanta;
    }

    public Long getIdCultivo() { return idCultivo; }
    public void setIdCultivo(Long idCultivo) { this.idCultivo = idCultivo; }

    public String getNomePlanta() { return nomePlanta; }
    public void setNomePlanta(String nomePlanta) { this.nomePlanta = nomePlanta; }

    public String getNomeArea() { return nomeArea; }
    public void setNomeArea(String nomeArea) { this.nomeArea = nomeArea; }

    public Double getTamanhoArea() { return tamanhoArea; }
    public void setTamanhoArea(Double tamanhoArea) { this.tamanhoArea = tamanhoArea; }

    public Double getQuantidadeColhida() { return quantidadeColhida; }
    public void setQuantidadeColhida(Double quantidadeColhida) { this.quantidadeColhida = quantidadeColhida; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public Double getProdutividadeKgHa() { return produtividadeKgHa; }
    public void setProdutividadeKgHa(Double produtividadeKgHa) { this.produtividadeKgHa = produtividadeKgHa; }

    public String getDataPlantio() { return dataPlantio; }
    public void setDataPlantio(String dataPlantio) { this.dataPlantio = dataPlantio; }

    public String getDataEncerramento() { return dataEncerramento; }
    public void setDataEncerramento(String dataEncerramento) { this.dataEncerramento = dataEncerramento; }

    public String getStatusCultivo() { return statusCultivo; }
    public void setStatusCultivo(String statusCultivo) { this.statusCultivo = statusCultivo; }

    public String getEstadoPlanta() { return estadoPlanta; }
    public void setEstadoPlanta(String estadoPlanta) { this.estadoPlanta = estadoPlanta; }
}
