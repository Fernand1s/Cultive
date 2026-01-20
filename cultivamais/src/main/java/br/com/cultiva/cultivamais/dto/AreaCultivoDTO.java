package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.QuantidadeLuz;
import br.com.cultiva.cultivamais.model.TipoSolo;
import jakarta.validation.constraints.*;

public class AreaCultivoDTO {

    private Long idArea;

    @NotBlank(message = "O nome da área é obrigatório")
    private String nomeArea;
    private String localizacaoArea;

    @Min(value = -90) @Max(value = 90)
    private double latitudeArea;

    @Min(value = -180) @Max(value = 180)
    private double longitudeArea;

    @Positive(message = "O tamanho deve ser maior que zero")
    private double tamanhoArea;

    @NotNull(message = "O tipo de solo deve ser informado")
    private TipoSolo tipoSolo;
    private QuantidadeLuz quantidadeLuz;
    private String observacaoArea;

    public AreaCultivoDTO() {
    }

    public AreaCultivoDTO(Long idArea, String nomeArea, String localizacaoArea, double latitudeArea,
                          double longitudeArea, double tamanhoArea, TipoSolo tipoSolo,
                          QuantidadeLuz quantidadeLuz, String observacaoArea) {
        this.idArea = idArea;
        this.nomeArea = nomeArea;
        this.localizacaoArea = localizacaoArea;
        this.latitudeArea = latitudeArea;
        this.longitudeArea = longitudeArea;
        this.tamanhoArea = tamanhoArea;
        this.tipoSolo = tipoSolo;
        this.quantidadeLuz = quantidadeLuz;
        this.observacaoArea = observacaoArea;
    }

    public Long getIdArea() {
        return idArea;
    }

    public void setIdArea(Long idArea) {
        this.idArea = idArea;
    }

    public String getNomeArea() {
        return nomeArea;
    }

    public void setNomeArea(String nomeArea) {
        this.nomeArea = nomeArea;
    }

    public String getLocalizacaoArea() {
        return localizacaoArea;
    }

    public void setLocalizacaoArea(String localizacaoArea) {
        this.localizacaoArea = localizacaoArea;
    }

    public double getLatitudeArea() {
        return latitudeArea;
    }

    public void setLatitudeArea(double latitudeArea) {
        this.latitudeArea = latitudeArea;
    }

    public double getLongitudeArea() {
        return longitudeArea;
    }

    public void setLongitudeArea(double longitudeArea) {
        this.longitudeArea = longitudeArea;
    }

    public double getTamanhoArea() {
        return tamanhoArea;
    }

    public void setTamanhoArea(double tamanhoArea) {
        this.tamanhoArea = tamanhoArea;
    }

    public TipoSolo getTipoSolo() {
        return tipoSolo;
    }

    public void setTipoSolo(TipoSolo tipoSolo) {
        this.tipoSolo = tipoSolo;
    }

    public QuantidadeLuz getQuantidadeLuz() {
        return quantidadeLuz;
    }

    public void setQuantidadeLuz(QuantidadeLuz quantidadeLuz) {
        this.quantidadeLuz = quantidadeLuz;
    }

    public String getObservacaoArea() {
        return observacaoArea;
    }

    public void setObservacaoArea(String observacaoArea) {
        this.observacaoArea = observacaoArea;
    }
}