package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.TenantRegistrationDTO;
import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import br.com.cultiva.cultivamais.model.Tenant;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.multitenant.TenantContext;
import br.com.cultiva.cultivamais.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Service
public class TenantService {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UsuarioService usuarioService;

    public Tenant registrarTenant(TenantRegistrationDTO dto) throws SQLException {
        if (tenantRepository.existsBySchemaName(dto.getSchemaName())) {
            throw new RuntimeException("Schema '" + dto.getSchemaName() + "' já está em uso.");
        }

        // 1. Cria o schema físico e as tabelas via script SQL
        criarSchema(dto.getSchemaName());

        // 2. Registra o tenant na tabela pública (schema-qualified: sempre vai para public.tenant)
        Tenant tenant = tenantRepository.save(new Tenant(dto.getNomeEmpresa(), dto.getSchemaName()));

        // 3. Cria o usuário administrador no schema do novo tenant
        TenantContext.setCurrentTenant(dto.getSchemaName());
        try {
            Usuario admin = new Usuario();
            admin.setNomeUsuario(dto.getAdminNome());
            admin.setEmail(dto.getAdminEmail());
            admin.setSenha(dto.getAdminSenha());
            admin.setFuncao(FuncaoUsuario.ADMINISTRADOR);
            admin.setAtivo(true);
            // criarUsuario() já salva o mapeamento em public.usuario_tenant
            usuarioService.criarUsuario(admin);
        } finally {
            TenantContext.clear();
        }

        return tenant;
    }

    private void criarSchema(String schemaName) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            String dbUrl = conn.getMetaData().getURL().toLowerCase();
            boolean isH2 = dbUrl.contains("h2");

            if (isH2) {
                // H2 folds unquoted identifiers to uppercase — CREATE e setSchema devem usar o mesmo nome
                String schemaUpper = schemaName.toUpperCase();
                conn.createStatement().execute("CREATE SCHEMA IF NOT EXISTS " + schemaUpper);
                conn.setSchema(schemaUpper);
            } else {
                // PostgreSQL: identificadores entre aspas preservam o case
                conn.createStatement().execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaName + "\"");
                conn.createStatement().execute("SET search_path TO \"" + schemaName + "\"");
            }

            String scriptPath = isH2 ? "db/tenant-init-h2.sql" : "db/tenant-init-pg.sql";
            ScriptUtils.executeSqlScript(conn, new ClassPathResource(scriptPath));
        }
    }
}
