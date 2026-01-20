package br.com.cultiva.cultivamais.dto;

public class ConsumoAguaDTO {
    private Long idCultivo;
    private String planta;
    private double totalVolumeLitros;

    public ConsumoAguaDTO(){}

    public ConsumoAguaDTO(Long idCultivo, String planta, double totalVolumeLitros) {
        this.idCultivo = idCultivo;
        this.planta = planta;
        this.totalVolumeLitros = totalVolumeLitros;
    }

    public Long getIdCultivo() {
        return idCultivo;
    }

    public void setIdCultivo(Long idCultivo) {
        this.idCultivo = idCultivo;
    }

    public String getPlanta() {
        return planta;
    }

    public void setPlanta(String planta) {
        this.planta = planta;
    }

    public double getTotalVolumeLitros() {
        return totalVolumeLitros;
    }

    public void setTotalVolumeLitros(double totalVolumeLitros) {
        this.totalVolumeLitros = totalVolumeLitros;
    }
}
