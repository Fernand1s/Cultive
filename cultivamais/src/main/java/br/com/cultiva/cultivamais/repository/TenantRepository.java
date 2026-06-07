package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    boolean existsBySchemaName(String schemaName);
}
