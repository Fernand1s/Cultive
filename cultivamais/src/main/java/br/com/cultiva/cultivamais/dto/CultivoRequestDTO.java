package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.EstadoPlanta;
import br.com.cultiva.cultivamais.model.StatusCultivo;
import br.com.cultiva.cultivamais.model.TipoCiclo;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class CultivoRequestDTO {

    @NotNull(message = "O ID da planta é obrigatório")
    private Long idPlanta;

    @NotNull(message = "O ID da área é obrigatório")
    private Long idArea;

    private TipoCiclo tipoCiclo;
    private String unidadeMedida;

    @Positive(message = "A quantidade deve ser maior que zero")
    private Double quantidadePlantada;

    @NotNull(message = "A data de plantio é obrigatória")
    private LocalDate dataPlantio;

    private EstadoPlanta estadoPlanta;
    private StatusCultivo statusCultivo;
    private String observacaoCultivo;
    private Double quantidadeColhida;
    private LocalDate dataColheitaFinal;

    public CultivoRequestDTO() {
    }

    public CultivoRequestDTO(Long idPlanta, Long idArea, Double quantidadePlantada, LocalDate dataPlantio,
                             EstadoPlanta estadoPlanta, StatusCultivo statusCultivo, String observacaoCultivo,
                             Double quantidadeColhida, LocalDate dataColheitaFinal) {
        this.idPlanta = idPlanta;
        this.idArea = idArea;
        this.quantidadePlantada = quantidadePlantada;
        this.dataPlantio = dataPlantio;
        this.estadoPlanta = estadoPlanta;
        this.statusCultivo = statusCultivo;
        this.observacaoCultivo = observacaoCultivo;
        this.quantidadeColhida = quantidadeColhida;
        this.dataColheitaFinal = dataColheitaFinal;
    }

    public Long getIdPlanta() {
        return idPlanta;
    }

    public void setIdPlanta(Long idPlanta) {
        this.idPlanta = idPlanta;
    }

    public Long getIdArea() {
        return idArea;
    }

    public void setIdArea(Long idArea) {
        this.idArea = idArea;
    }

    public double getQuantidadePlantada() {
        return quantidadePlantada;
    }

    public void setQuantidadePlantada(double quantidadePlantada) {
        this.quantidadePlantada = quantidadePlantada;
    }

    public LocalDate getDataPlantio() {
        return dataPlantio;
    }

    public void setDataPlantio(LocalDate dataPlantio) {
        this.dataPlantio = dataPlantio;
    }

    public EstadoPlanta getEstadoPlanta() {
        return estadoPlanta;
    }

    public void setEstadoPlanta(EstadoPlanta estadoPlanta) {
        this.estadoPlanta = estadoPlanta;
    }

    public StatusCultivo getStatusCultivo() {
        return statusCultivo;
    }

    public void setStatusCultivo(StatusCultivo statusCultivo) {
        this.statusCultivo = statusCultivo;
    }

    public String getObservacaoCultivo() {
        return observacaoCultivo;
    }

    public void setObservacaoCultivo(String observacaoCultivo) {
        this.observacaoCultivo = observacaoCultivo;
    }

    public Double getQuantidadeColhida() {
        return quantidadeColhida;
    }

    public void setQuantidadeColhida(Double quantidadeColhida) {
        this.quantidadeColhida = quantidadeColhida;
    }

    public LocalDate getDataColheitaFinal() { return dataColheitaFinal; }
    public void setDataColheitaFinal(LocalDate dataColheitaFinal) { this.dataColheitaFinal = dataColheitaFinal; }

    public TipoCiclo getTipoCiclo() { return tipoCiclo; }
    public void setTipoCiclo(TipoCiclo tipoCiclo) { this.tipoCiclo = tipoCiclo; }
    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
}