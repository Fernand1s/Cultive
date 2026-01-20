package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.NivelAfetacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class DoencaPragaDTO extends EventoBaseDTO {

    @NotBlank(message = "O nome da praga ou doença é obrigatório")
    private String nomePraga;

    @NotNull(message = "O nível de afetação deve ser informado")
    private NivelAfetacao nivel;

    public DoencaPragaDTO() {
        super();
    }

    public DoencaPragaDTO(Long idUsuario, LocalDateTime dataHora, String observacao, String nomePraga, NivelAfetacao nivel) {
        super(idUsuario, dataHora, observacao);
        this.nomePraga = nomePraga;
        this.nivel = nivel;
    }

    public String getNomePraga() {
        return nomePraga;
    }

    public void setNomePraga(String nomePraga) {
        this.nomePraga = nomePraga;
    }

    public NivelAfetacao getNivel() {
        return nivel;
    }

    public void setNivel(NivelAfetacao nivel) {
        this.nivel = nivel;
    }
}