package br.com.cultiva.cultivamais.config;

import br.com.cultiva.cultivamais.model.Tenant;
import br.com.cultiva.cultivamais.repository.TenantRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;

/**
 * Executa migrações DDL incrementais em todos os schemas de tenant existentes.
 * Usar sempre CREATE TABLE IF NOT EXISTS para garantir idempotência.
 */
@Configuration
public class MigrationConfig {

    private static final String DDL_ESTOQUE = """
            CREATE TABLE IF NOT EXISTS estoque (
                id_estoque BIGSERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                sku VARCHAR(255),
                categoria VARCHAR(50) NOT NULL,
                subcategoria VARCHAR(100),
                marca VARCHAR(255),
                modelo VARCHAR(255),
                fornecedor VARCHAR(255),
                codigo_identificador VARCHAR(255),
                data_aquisicao VARCHAR(50),
                valor_compra DOUBLE PRECISION,
                unidade_medida VARCHAR(50),
                localizacao VARCHAR(255),
                status VARCHAR(50),
                foto_preview TEXT,
                validade VARCHAR(50),
                principio_ativo TEXT,
                estoque_minimo BIGINT,
                quantidade_estoque BIGINT,
                horimetro_atual DOUBLE PRECISION,
                horas_revisao VARCHAR(100),
                tipo_combustivel VARCHAR(50),
                placa VARCHAR(20),
                capacidade_trabalho VARCHAR(255),
                compatibilidade_potencia VARCHAR(255)
            )
            """;

    @Bean
    @Order(200)
    CommandLineRunner migrarSchemasExistentes(TenantRepository tenantRepository, DataSource dataSource) {
        return args -> {
            // A migração incremental usa sintaxe específica do PostgreSQL (SET search_path).
            // No H2 (perfil dev) as colunas já vêm completas do script tenant-init-h2.sql,
            // então pulamos a migração silenciosamente para não poluir o console com erros.
            try (Connection conn = dataSource.getConnection()) {
                String dbUrl = conn.getMetaData().getURL().toLowerCase();
                if (dbUrl.contains("h2")) {
                    System.out.println(">>> [Migration] Banco H2 detectado — migração incremental ignorada (schema já completo via script).");
                    return;
                }
            }

            List<Tenant> tenants = tenantRepository.findAll();
            for (Tenant tenant : tenants) {
                String schema = tenant.getSchemaName();
                if ("public".equalsIgnoreCase(schema)) continue;

                try (Connection conn = dataSource.getConnection()) {
                    conn.createStatement().execute("SET search_path TO \"" + schema + "\"");
                    conn.createStatement().execute(DDL_ESTOQUE);
                    conn.createStatement().execute("ALTER TABLE usuario ADD COLUMN IF NOT EXISTS foto_perfil TEXT");

                    // Colunas adicionadas à tarefa (migração incremental)
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(255)");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS informacoes_extras TEXT");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS em_observacao BOOLEAN NOT NULL DEFAULT FALSE");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS foto_conclusao TEXT");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS insumos_usados_json TEXT");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS area_cultivo_id BIGINT REFERENCES area_cultivo(id_area)");
                    conn.createStatement().execute("ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS cultivo_id BIGINT REFERENCES cultivo(id_cultivo)");

                    // Colunas adicionadas à área de cultivo (migração incremental)
                    conn.createStatement().execute("ALTER TABLE area_cultivo ADD COLUMN IF NOT EXISTS topografia VARCHAR(50)");
                    conn.createStatement().execute("ALTER TABLE area_cultivo ADD COLUMN IF NOT EXISTS status_area VARCHAR(50)");
                    conn.createStatement().execute("ALTER TABLE area_cultivo ADD COLUMN IF NOT EXISTS cultura_anterior TEXT");

                    // Coluna de foto para planta
                    conn.createStatement().execute("ALTER TABLE planta ADD COLUMN IF NOT EXISTS foto_planta TEXT");

                    // Novos campos no cultivo
                    conn.createStatement().execute("ALTER TABLE cultivo ADD COLUMN IF NOT EXISTS tipo_ciclo VARCHAR(20) DEFAULT 'UNICO'");
                    conn.createStatement().execute("ALTER TABLE cultivo ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(50)");

                    // Novos campos no evento (herança SINGLE_TABLE — discriminator COLHEITA)
                    conn.createStatement().execute("ALTER TABLE evento ADD COLUMN IF NOT EXISTS quantidade_colhida DOUBLE PRECISION");
                    conn.createStatement().execute("ALTER TABLE evento ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(50)");
                    conn.createStatement().execute("ALTER TABLE evento ADD COLUMN IF NOT EXISTS foto_colheita TEXT");
                    conn.createStatement().execute("ALTER TABLE evento ADD COLUMN IF NOT EXISTS insumos_usados_json TEXT");

                    conn.createStatement().execute("SET search_path TO public");
                    System.out.printf(">>> [Migration] Schema '%s' atualizado.%n", schema);
                } catch (Exception e) {
                    System.err.printf(">>> [Migration] ERRO no schema '%s': %s%n", schema, e.getMessage());
                }
            }
        };
    }
}
