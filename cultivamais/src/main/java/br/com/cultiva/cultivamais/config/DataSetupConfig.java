package br.com.cultiva.cultivamais.config;

import br.com.cultiva.cultivamais.dto.TenantRegistrationDTO;
import br.com.cultiva.cultivamais.model.Tenant;
import br.com.cultiva.cultivamais.repository.TenantRepository;
import br.com.cultiva.cultivamais.service.TenantService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSetupConfig {

    // =========================================================
    //  TENANTS MASTER — Edite aqui para adicionar novas empresas
    // =========================================================
    private static final Object[][] TENANTS_MASTER = {
        // { nomeEmpresa,       schemaName,     adminNome,           adminEmail,              adminSenha      }
        { "Lotus",              "tenant_lotus", "Administrador Lotus", "admin@lotus.com.br",   "Lotus@2026"   },
        { "Horta Divertida",   "tenant_horta", "Administrador Horta", "admin@horta.com.br",   "Horta@2026"   },
    };
    // =========================================================

    @Bean
    CommandLineRunner setupInicial(TenantRepository tenantRepository, TenantService tenantService) {
        return args -> {
            // Garante que o tenant padrão (schema "public") está registrado
            if (!tenantRepository.existsBySchemaName("public")) {
                tenantRepository.save(new Tenant("Sistema Padrão", "public"));
                System.out.println(">>> Tenant padrão 'public' registrado.");
            }

            // Cria os tenants master configurados acima (pulsa silenciosamente se já existir)
            for (Object[] cfg : TENANTS_MASTER) {
                String schema = (String) cfg[1];
                if (tenantRepository.existsBySchemaName(schema)) continue;

                TenantRegistrationDTO dto = new TenantRegistrationDTO();
                dto.setNomeEmpresa((String) cfg[0]);
                dto.setSchemaName(schema);
                dto.setAdminNome((String) cfg[2]);
                dto.setAdminEmail((String) cfg[3]);
                dto.setAdminSenha((String) cfg[4]);

                tenantService.registrarTenant(dto);
                System.out.printf(">>> Tenant '%s' criado — login: %s%n", cfg[0], cfg[3]);
            }
        };
    }
}