package br.com.cultiva.cultivamais.dto;

import java.util.List;

public class RotacaoCulturaDTO {
    private Long idArea;
    private String nomeArea;
    private Double tamanhoArea;
    private String statusAtual;
    private List<CicloAreaDTO> historico;

    public RotacaoCulturaDTO() {}

    public RotacaoCulturaDTO(Long idArea, String nomeArea, Double tamanhoArea,
                              String statusAtual, List<CicloAreaDTO> historico) {
        this.idArea = idArea;
        this.nomeArea = nomeArea;
        this.tamanhoArea = tamanhoArea;
        this.statusAtual = statusAtual;
        this.historico = historico;
    }

    public Long getIdArea() { return idArea; }
    public void setIdArea(Long idArea) { this.idArea = idArea; }

    public String getNomeArea() { return nomeArea; }
    public void setNomeArea(String nomeArea) { this.nomeArea = nomeArea; }

    public Double getTamanhoArea() { return tamanhoArea; }
    public void setTamanhoArea(Double tamanhoArea) { this.tamanhoArea = tamanhoArea; }

    public String getStatusAtual() { return statusAtual; }
    public void setStatusAtual(String statusAtual) { this.statusAtual = statusAtual; }

    public List<CicloAreaDTO> getHistorico() { return historico; }
    public void setHistorico(List<CicloAreaDTO> historico) { this.historico = historico; }
}
