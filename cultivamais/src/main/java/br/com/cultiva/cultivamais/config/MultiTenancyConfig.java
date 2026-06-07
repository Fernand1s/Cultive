package br.com.cultiva.cultivamais.config;

import br.com.cultiva.cultivamais.multitenant.SchemaMultiTenantConnectionProvider;
import br.com.cultiva.cultivamais.multitenant.TenantIdentifierResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MultiTenancyConfig implements HibernatePropertiesCustomizer {

    @Autowired
    private TenantIdentifierResolver tenantIdentifierResolver;

    @Autowired
    private SchemaMultiTenantConnectionProvider connectionProvider;

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put("hibernate.multiTenancy", "SCHEMA");
        hibernateProperties.put("hibernate.tenant_identifier_resolver", tenantIdentifierResolver);
        hibernateProperties.put("hibernate.multi_tenant_connection_provider", connectionProvider);
    }
}
