package br.com.cultiva.cultivamais.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@DiscriminatorValue("COLHEITA")
public class Colheita extends Evento {

    private double quantidadeColhida;
    private String unidadeMedida;

    @Column(columnDefinition = "TEXT")
    private String fotoColheita;

    @Column(columnDefinition = "TEXT")
    private String insumosUsadosJson;

    public Colheita() {}

    public Colheita(Cultivo cultivo, LocalDateTime dataHora, String observacao,
                    double quantidadeColhida, String unidadeMedida) {
        super(cultivo, dataHora, observacao);
        this.quantidadeColhida = quantidadeColhida;
        this.unidadeMedida = unidadeMedida;
    }

    public double getQuantidadeColhida() { return quantidadeColhida; }
    public void setQuantidadeColhida(double quantidadeColhida) { this.quantidadeColhida = quantidadeColhida; }

    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }

    public String getFotoColheita() { return fotoColheita; }
    public void setFotoColheita(String fotoColheita) { this.fotoColheita = fotoColheita; }

    public String getInsumosUsadosJson() { return insumosUsadosJson; }
    public void setInsumosUsadosJson(String insumosUsadosJson) { this.insumosUsadosJson = insumosUsadosJson; }
}
