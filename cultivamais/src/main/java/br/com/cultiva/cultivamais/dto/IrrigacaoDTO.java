package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.MetodoIrrigacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public class IrrigacaoDTO extends EventoBaseDTO {
    @Positive
    private double volumeAgua;
    @NotNull
    private MetodoIrrigacao metodo;

    public IrrigacaoDTO() {
        super();
    }

    public IrrigacaoDTO(Long idUsuario, LocalDateTime dataHora, String observacao, double volumeAgua, MetodoIrrigacao metodo) {
        super(idUsuario, dataHora, observacao);
        this.volumeAgua = volumeAgua;
        this.metodo = metodo;
    }

    public double getVolumeAgua() {
        return volumeAgua;
    }

    public void setVolumeAgua(double volumeAgua) {
        this.volumeAgua = volumeAgua;
    }

    public MetodoIrrigacao getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoIrrigacao metodo) {
        this.metodo = metodo;
    }
}


