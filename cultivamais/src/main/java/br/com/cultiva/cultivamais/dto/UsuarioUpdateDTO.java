package br.com.cultiva.cultivamais.dto;

import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import jakarta.validation.constraints.*;

public class UsuarioUpdateDTO {

    @NotBlank(message = "O nome é obrigatório")
    private String nomeUsuario;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotNull(message = "A função é obrigatória")
    private FuncaoUsuario funcao;

    @NotNull(message = "O status ativo deve ser informado")
    private Boolean ativo;

    // Opcionais — só alteram se preenchidos
    private String senhaAtual;
    private String senha;
    private String fotoPerfil;

    public UsuarioUpdateDTO() {
    }

    public UsuarioUpdateDTO(String nomeUsuario, String email, FuncaoUsuario funcao, Boolean ativo) {
        this.nomeUsuario = nomeUsuario;
        this.email = email;
        this.funcao = funcao;
        this.ativo = ativo;
    }

    public String getNomeUsuario() {
        return nomeUsuario;
    }

    public void setNomeUsuario(String nomeUsuario) {
        this.nomeUsuario = nomeUsuario;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public FuncaoUsuario getFuncao() {
        return funcao;
    }

    public void setFuncao(FuncaoUsuario funcao) {
        this.funcao = funcao;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public String getSenhaAtual() {
        return senhaAtual;
    }

    public void setSenhaAtual(String senhaAtual) {
        this.senhaAtual = senhaAtual;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }
}