package br.com.cultiva.cultivamais.dto;

public class CicloAreaDTO {
    private Long idCultivo;
    private String nomePlanta;
    private String statusCultivo;
    private String dataPlantio;
    private String dataEncerramento;
    private Double quantidadeColhida;
    private String unidadeMedida;

    public CicloAreaDTO() {}

    public CicloAreaDTO(Long idCultivo, String nomePlanta, String statusCultivo,
                         String dataPlantio, String dataEncerramento,
                         Double quantidadeColhida, String unidadeMedida) {
        this.idCultivo = idCultivo;
        this.nomePlanta = nomePlanta;
        this.statusCultivo = statusCultivo;
        this.dataPlantio = dataPlantio;
        this.dataEncerramento = dataEncerramento;
        this.quantidadeColhida = quantidadeColhida;
        this.unidadeMedida = unidadeMedida;
    }

    public Long getIdCultivo() { return idCultivo; }
    public void setIdCultivo(Long idCultivo) { this.idCultivo = idCultivo; }

    public String getNomePlanta() { return nomePlanta; }
    public void setNomePlanta(String nomePlanta) { this.nomePlanta = nomePlanta; }

    public String getStatusCultivo() { return statusCultivo; }
    public void setStatusCultivo(String statusCultivo) { this.statusCultivo = statusCultivo; }

    public String getDataPlantio() { return dataPlantio; }
    public void setDataPlantio(String dataPlantio) { this.dataPlantio = dataPlantio; }

    public String getDataEncerramento() { return dataEncerramento; }
    public void setDataEncerramento(String dataEncerramento) { this.dataEncerramento = dataEncerramento; }

    public Double getQuantidadeColhida() { return quantidadeColhida; }
    public void setQuantidadeColhida(Double quantidadeColhida) { this.quantidadeColhida = quantidadeColhida; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
}
