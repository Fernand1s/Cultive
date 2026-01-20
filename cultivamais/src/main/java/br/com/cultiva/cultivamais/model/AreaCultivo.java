package br.com.cultiva.cultivamais.model;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
public class AreaCultivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idArea;
    private String nomeArea;
    private String localizacaoArea;
    private Double latitudeArea;
    private Double longitudeArea;
    private Double tamanhoArea;

    @Enumerated(EnumType.STRING)
    private QuantidadeLuz quantidadeLuz;

    @Enumerated(EnumType.STRING)
    private TipoSolo tipoSolo;
    private String observacaoArea;

    @ManyToMany
    @JoinTable(
            name = "area_usuario_responsavel",
            joinColumns = @JoinColumn(name = "area_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    @JsonIgnoreProperties("areasAtendidas")
    private List<Usuario> usuariosResponsaveis = new ArrayList<>();

    @OneToMany(mappedBy = "areaCultivo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Cultivo> cultivos = new ArrayList<>();

    public AreaCultivo() {}

    public AreaCultivo (String nomeArea){
        this.nomeArea = nomeArea;
        this.cultivos = new ArrayList<>();
        this.usuariosResponsaveis = new ArrayList<>();
    }

    public void adicionarCultivo(Cultivo novoCultivo) {
        if (novoCultivo != null) {
            if (this.cultivos == null) this.cultivos = new ArrayList<>();
            this.cultivos.add(novoCultivo);
            novoCultivo.setAreaCultivo(this);
        }
    }

    // Getters
    public Long getIdArea() { return idArea; }
    public String getNomeArea(){ return this.nomeArea; }
    public String getLocalizacaoArea(){ return this.localizacaoArea; }
    public Double getLatitudeArea(){ return this.latitudeArea; }
    public Double getLongitudeArea(){ return this.longitudeArea; }
    public Double getTamanhoArea(){ return this.tamanhoArea; }
    public TipoSolo getTipoSolo(){ return this.tipoSolo; }
    public String getObservacaoArea(){ return this.observacaoArea; }
    public List<Cultivo> getCultivos(){ return this.cultivos; }
    public QuantidadeLuz getQuantidadeLuz() { return this.quantidadeLuz; }
    public List<Usuario> getUsuariosResponsaveis() { return usuariosResponsaveis; }

    // Setters
    public void setIdArea(Long idArea) { this.idArea = idArea; }
    public void setNomeArea(String nomeArea){ this.nomeArea = nomeArea; }
    public void setLocalizacaoArea(String localizacaoArea){ this.localizacaoArea = localizacaoArea; }
    public void setLongitudeArea(Double longitudeArea){ this.longitudeArea = longitudeArea; }
    public void setLatitudeArea(Double latitudeArea){ this.latitudeArea = latitudeArea; }
    public void setTamanhoArea(Double tamanhoArea){ this.tamanhoArea = tamanhoArea; }
    public void setTipoSolo(TipoSolo tipoSolo){ this.tipoSolo = tipoSolo; }
    public void setObservacaoArea(String observacaoArea) { this.observacaoArea = observacaoArea; }
    public void setQuantidadeLuz(QuantidadeLuz quantidadeLuz) { this.quantidadeLuz = quantidadeLuz; }
    public void setUsuariosResponsaveis(List<Usuario> usuariosResponsaveis) { this.usuariosResponsaveis = usuariosResponsaveis; }

}