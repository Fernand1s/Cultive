package br.com.cultiva.cultivamais.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario_tenant", schema = "public")
public class UsuarioTenant {

    @Id
    private String email;

    @Column(nullable = false)
    private String tenantSchema;

    public UsuarioTenant() {}

    public UsuarioTenant(String email, String tenantSchema) {
        this.email = email;
        this.tenantSchema = tenantSchema;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTenantSchema() { return tenantSchema; }
    public void setTenantSchema(String tenantSchema) { this.tenantSchema = tenantSchema; }
}
