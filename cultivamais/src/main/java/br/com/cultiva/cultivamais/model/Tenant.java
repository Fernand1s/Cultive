package br.com.cultiva.cultivamais.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant", schema = "public")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeEmpresa;

    @Column(nullable = false, unique = true)
    private String schemaName;

    private Boolean ativo = true;

    private LocalDateTime dataCriacao;

    public Tenant() {
        this.dataCriacao = LocalDateTime.now();
    }

    public Tenant(String nomeEmpresa, String schemaName) {
        this.nomeEmpresa = nomeEmpresa;
        this.schemaName = schemaName;
        this.ativo = true;
        this.dataCriacao = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getNomeEmpresa() { return nomeEmpresa; }
    public void setNomeEmpresa(String nomeEmpresa) { this.nomeEmpresa = nomeEmpresa; }
    public String getSchemaName() { return schemaName; }
    public void setSchemaName(String schemaName) { this.schemaName = schemaName; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
}
