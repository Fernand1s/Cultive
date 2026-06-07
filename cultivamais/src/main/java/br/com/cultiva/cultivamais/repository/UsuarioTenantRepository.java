package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.model.UsuarioTenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioTenantRepository extends JpaRepository<UsuarioTenant, String> {
    Optional<UsuarioTenant> findByEmail(String email);
}
