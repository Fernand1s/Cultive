    package br.com.cultiva.cultivamais.dto;
    
    import br.com.cultiva.cultivamais.model.*;
    import jakarta.validation.constraints.*;
    import java.util.Set;
    
    public class PlantaDTO {

        private Long idPlanta;
    
        @NotBlank(message = "O nome popular é obrigatório")
        private String nomePopular;
    
        private String nomeCientifico;

        @NotNull(message = "O tipo de planta é obrigatório")
        private TipoPlanta tipoPlanta;
    
        @Min(value = 1, message = "O ciclo médio deve ser de ao menos 1 dia")
        private int cicloMedioDias;
    
        private String descricaoPlanta;
        private String fotoPlanta;

        @NotNull(message = "A recomendação de luz é obrigatória")
        private QuantidadeLuz luzRecomendada;
    
        @NotNull(message = "A recomendação de água é obrigatória")
        private QuantidadeAgua aguaRecomendada;
    
        private Set<TipoSolo> solosRecomendados;

        public PlantaDTO() {
        }

        public PlantaDTO(Long idPlanta, String nomePopular, String nomeCientifico, TipoPlanta tipoPlanta,
                         int cicloMedioDias, String descricaoPlanta, QuantidadeLuz luzRecomendada,
                         QuantidadeAgua aguaRecomendada, Set<TipoSolo> solosRecomendados) {
            this.idPlanta = idPlanta;
            this.nomePopular = nomePopular;
            this.nomeCientifico = nomeCientifico;
            this.tipoPlanta = tipoPlanta;
            this.cicloMedioDias = cicloMedioDias;
            this.descricaoPlanta = descricaoPlanta;
            this.luzRecomendada = luzRecomendada;
            this.aguaRecomendada = aguaRecomendada;
            this.solosRecomendados = solosRecomendados;
        }

        public Long getIdPlanta() {
            return idPlanta;
        }

        public void setIdPlanta(Long idPlanta) {
            this.idPlanta = idPlanta;
        }

        public String getNomePopular() {
            return nomePopular;
        }

        public void setNomePopular(String nomePopular) {
            this.nomePopular = nomePopular;
        }

        public String getNomeCientifico() {
            return nomeCientifico;
        }

        public void setNomeCientifico(String nomeCientifico) {
            this.nomeCientifico = nomeCientifico;
        }

        public TipoPlanta getTipoPlanta() {
            return tipoPlanta;
        }

        public void setTipoPlanta(TipoPlanta tipoPlanta) {
            this.tipoPlanta = tipoPlanta;
        }

        public int getCicloMedioDias() {
            return cicloMedioDias;
        }

        public void setCicloMedioDias(int cicloMedioDias) {
            this.cicloMedioDias = cicloMedioDias;
        }

        public String getDescricaoPlanta() { return descricaoPlanta; }
        public void setDescricaoPlanta(String descricaoPlanta) { this.descricaoPlanta = descricaoPlanta; }

        public String getFotoPlanta() { return fotoPlanta; }
        public void setFotoPlanta(String fotoPlanta) { this.fotoPlanta = fotoPlanta; }

        public QuantidadeLuz getLuzRecomendada() {
            return luzRecomendada;
        }

        public void setLuzRecomendada(QuantidadeLuz luzRecomendada) {
            this.luzRecomendada = luzRecomendada;
        }

        public QuantidadeAgua getAguaRecomendada() {
            return aguaRecomendada;
        }

        public void setAguaRecomendada(QuantidadeAgua aguaRecomendada) {
            this.aguaRecomendada = aguaRecomendada;
        }

        public Set<TipoSolo> getSolosRecomendados() {
            return solosRecomendados;
        }

        public void setSolosRecomendados(Set<TipoSolo> solosRecomendados) {
            this.solosRecomendados = solosRecomendados;
        }
    }