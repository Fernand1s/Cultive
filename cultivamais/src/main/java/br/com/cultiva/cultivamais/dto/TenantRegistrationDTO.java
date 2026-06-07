package br.com.cultiva.cultivamais.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TenantRegistrationDTO {

    @NotBlank
    private String nomeEmpresa;

    @NotBlank
    @Pattern(
        regexp = "^[a-z][a-z0-9_]{0,62}$",
        message = "schemaName deve conter apenas letras minúsculas, números e underscores, e começar com letra."
    )
    private String schemaName;

    @NotBlank
    private String adminNome;

    @NotBlank
    @Email
    private String adminEmail;

    @NotBlank
    private String adminSenha;

    public String getNomeEmpresa() { return nomeEmpresa; }
    public void setNomeEmpresa(String nomeEmpresa) { this.nomeEmpresa = nomeEmpresa; }

    public String getSchemaName() { return schemaName; }
    public void setSchemaName(String schemaName) { this.schemaName = schemaName; }

    public String getAdminNome() { return adminNome; }
    public void setAdminNome(String adminNome) { this.adminNome = adminNome; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public String getAdminSenha() { return adminSenha; }
    public void setAdminSenha(String adminSenha) { this.adminSenha = adminSenha; }
}
