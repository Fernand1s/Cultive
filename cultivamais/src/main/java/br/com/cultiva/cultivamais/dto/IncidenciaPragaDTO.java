package br.com.cultiva.cultivamais.dto;

public class IncidenciaPragaDTO {
    private String nomePraga;
    private Long ocorrencias;
    private String nivelMaisGrave;
    private String areaMaisAfetada;
    private String plantaMaisAfetada;
    private String ultimaOcorrencia;

    public IncidenciaPragaDTO() {}

    public IncidenciaPragaDTO(String nomePraga, Long ocorrencias, String nivelMaisGrave,
                               String areaMaisAfetada, String plantaMaisAfetada, String ultimaOcorrencia) {
        this.nomePraga = nomePraga;
        this.ocorrencias = ocorrencias;
        this.nivelMaisGrave = nivelMaisGrave;
        this.areaMaisAfetada = areaMaisAfetada;
        this.plantaMaisAfetada = plantaMaisAfetada;
        this.ultimaOcorrencia = ultimaOcorrencia;
    }

    public String getNomePraga() { return nomePraga; }
    public void setNomePraga(String nomePraga) { this.nomePraga = nomePraga; }

    public Long getOcorrencias() { return ocorrencias; }
    public void setOcorrencias(Long ocorrencias) { this.ocorrencias = ocorrencias; }

    public String getNivelMaisGrave() { return nivelMaisGrave; }
    public void setNivelMaisGrave(String nivelMaisGrave) { this.nivelMaisGrave = nivelMaisGrave; }

    public String getAreaMaisAfetada() { return areaMaisAfetada; }
    public void setAreaMaisAfetada(String areaMaisAfetada) { this.areaMaisAfetada = areaMaisAfetada; }

    public String getPlantaMaisAfetada() { return plantaMaisAfetada; }
    public void setPlantaMaisAfetada(String plantaMaisAfetada) { this.plantaMaisAfetada = plantaMaisAfetada; }

    public String getUltimaOcorrencia() { return ultimaOcorrencia; }
    public void setUltimaOcorrencia(String ultimaOcorrencia) { this.ultimaOcorrencia = ultimaOcorrencia; }
}
