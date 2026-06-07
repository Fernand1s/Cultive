package br.com.cultiva.cultivamais.multitenant;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Component
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    @Autowired
    private DataSource dataSource;

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = dataSource.getConnection();
        setSchema(connection, tenantIdentifier);
        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        setSchema(connection, TenantIdentifierResolver.DEFAULT_TENANT);
        connection.close();
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        throw new UnsupportedOperationException("Unwrap não suportado por SchemaMultiTenantConnectionProvider");
    }

    private void setSchema(Connection connection, String schema) throws SQLException {
        String dbUrl = connection.getMetaData().getURL().toLowerCase();
        if (dbUrl.contains("postgresql") || dbUrl.contains("postgres")) {
            try (var stmt = connection.createStatement()) {
                stmt.execute("SET search_path TO \"" + schema + "\"");
            }
        } else {
            // H2 e outros bancos com suporte JDBC padrão
            connection.setSchema(schema.toUpperCase());
        }
    }
}
