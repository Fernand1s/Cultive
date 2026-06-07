package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.TenantRegistrationDTO;
import br.com.cultiva.cultivamais.model.Tenant;
import br.com.cultiva.cultivamais.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    @Autowired
    private TenantService tenantService;

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@Valid @RequestBody TenantRegistrationDTO dto) {
        try {
            Tenant tenant = tenantService.registrarTenant(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", tenant.getId(),
                    "nomeEmpresa", tenant.getNomeEmpresa(),
                    "schemaName", tenant.getSchemaName(),
                    "dataCriacao", tenant.getDataCriacao().toString()
            ));
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Falha ao criar schema: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erro", e.getMessage()));
        }
    }
}
