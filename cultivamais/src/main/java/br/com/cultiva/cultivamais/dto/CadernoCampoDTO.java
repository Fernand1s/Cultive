package br.com.cultiva.cultivamais.dto;

import java.util.List;

public class CadernoCampoDTO {
    private Long idCultivo;
    private String nomePlanta;
    private String nomeCientifico;
    private String nomeArea;
    private String dataPlantio;
    private String previsaoColheita;
    private String dataEncerramento;
    private String statusCultivo;
    private String estadoPlanta;
    private Double quantidadePlantada;
    private Double quantidadeColhida;
    private String unidadeMedida;
    private String observacao;
    private List<HistoricoPragaDTO> pragas;
    private List<ColheitaResumoDTO> colheitas;
    private int totalIrrigacoes;
    private Double totalAguaLitros;
    private List<String> responsaveis;

    public CadernoCampoDTO() {}

    public Long getIdCultivo() { return idCultivo; }
    public void setIdCultivo(Long idCultivo) { this.idCultivo = idCultivo; }

    public String getNomePlanta() { return nomePlanta; }
    public void setNomePlanta(String nomePlanta) { this.nomePlanta = nomePlanta; }

    public String getNomeCientifico() { return nomeCientifico; }
    public void setNomeCientifico(String nomeCientifico) { this.nomeCientifico = nomeCientifico; }

    public String getNomeArea() { return nomeArea; }
    public void setNomeArea(String nomeArea) { this.nomeArea = nomeArea; }

    public String getDataPlantio() { return dataPlantio; }
    public void setDataPlantio(String dataPlantio) { this.dataPlantio = dataPlantio; }

    public String getPrevisaoColheita() { return previsaoColheita; }
    public void setPrevisaoColheita(String previsaoColheita) { this.previsaoColheita = previsaoColheita; }

    public String getDataEncerramento() { return dataEncerramento; }
    public void setDataEncerramento(String dataEncerramento) { this.dataEncerramento = dataEncerramento; }

    public String getStatusCultivo() { return statusCultivo; }
    public void setStatusCultivo(String statusCultivo) { this.statusCultivo = statusCultivo; }

    public String getEstadoPlanta() { return estadoPlanta; }
    public void setEstadoPlanta(String estadoPlanta) { this.estadoPlanta = estadoPlanta; }

    public Double getQuantidadePlantada() { return quantidadePlantada; }
    public void setQuantidadePlantada(Double quantidadePlantada) { this.quantidadePlantada = quantidadePlantada; }

    public Double getQuantidadeColhida() { return quantidadeColhida; }
    public void setQuantidadeColhida(Double quantidadeColhida) { this.quantidadeColhida = quantidadeColhida; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public List<HistoricoPragaDTO> getPragas() { return pragas; }
    public void setPragas(List<HistoricoPragaDTO> pragas) { this.pragas = pragas; }

    public List<ColheitaResumoDTO> getColheitas() { return colheitas; }
    public void setColheitas(List<ColheitaResumoDTO> colheitas) { this.colheitas = colheitas; }

    public int getTotalIrrigacoes() { return totalIrrigacoes; }
    public void setTotalIrrigacoes(int totalIrrigacoes) { this.totalIrrigacoes = totalIrrigacoes; }

    public Double getTotalAguaLitros() { return totalAguaLitros; }
    public void setTotalAguaLitros(Double totalAguaLitros) { this.totalAguaLitros = totalAguaLitros; }

    public List<String> getResponsaveis() { return responsaveis; }
    public void setResponsaveis(List<String> responsaveis) { this.responsaveis = responsaveis; }
}
