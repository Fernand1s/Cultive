package br.com.cultiva.cultivamais.dto;

public class OcupacaoAreaDTO {
    private Long idArea;
    private String nomeArea;
    private Double tamanhoArea;
    private String statusAtual;
    private Long diasOcupadoTotal;
    private Long diasOciosoTotal;
    private Long totalDiasPeriodo;
    private Double taxaOcupacao;
    private int totalCultivos;

    public OcupacaoAreaDTO() {}

    public OcupacaoAreaDTO(Long idArea, String nomeArea, Double tamanhoArea, String statusAtual,
                            Long diasOcupadoTotal, Long diasOciosoTotal, Long totalDiasPeriodo,
                            Double taxaOcupacao, int totalCultivos) {
        this.idArea = idArea;
        this.nomeArea = nomeArea;
        this.tamanhoArea = tamanhoArea;
        this.statusAtual = statusAtual;
        this.diasOcupadoTotal = diasOcupadoTotal;
        this.diasOciosoTotal = diasOciosoTotal;
        this.totalDiasPeriodo = totalDiasPeriodo;
        this.taxaOcupacao = taxaOcupacao;
        this.totalCultivos = totalCultivos;
    }

    public Long getIdArea() { return idArea; }
    public void setIdArea(Long idArea) { this.idArea = idArea; }

    public String getNomeArea() { return nomeArea; }
    public void setNomeArea(String nomeArea) { this.nomeArea = nomeArea; }

    public Double getTamanhoArea() { return tamanhoArea; }
    public void setTamanhoArea(Double tamanhoArea) { this.tamanhoArea = tamanhoArea; }

    public String getStatusAtual() { return statusAtual; }
    public void setStatusAtual(String statusAtual) { this.statusAtual = statusAtual; }

    public Long getDiasOcupadoTotal() { return diasOcupadoTotal; }
    public void setDiasOcupadoTotal(Long diasOcupadoTotal) { this.diasOcupadoTotal = diasOcupadoTotal; }

    public Long getDiasOciosoTotal() { return diasOciosoTotal; }
    public void setDiasOciosoTotal(Long diasOciosoTotal) { this.diasOciosoTotal = diasOciosoTotal; }

    public Long getTotalDiasPeriodo() { return totalDiasPeriodo; }
    public void setTotalDiasPeriodo(Long totalDiasPeriodo) { this.totalDiasPeriodo = totalDiasPeriodo; }

    public Double getTaxaOcupacao() { return taxaOcupacao; }
    public void setTaxaOcupacao(Double taxaOcupacao) { this.taxaOcupacao = taxaOcupacao; }

    public int getTotalCultivos() { return totalCultivos; }
    public void setTotalCultivos(int totalCultivos) { this.totalCultivos = totalCultivos; }
}
