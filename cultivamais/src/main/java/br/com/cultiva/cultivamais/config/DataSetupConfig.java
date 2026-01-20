package br.com.cultiva.cultivamais.config;

import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import br.com.cultiva.cultivamais.service.UsuarioService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSetupConfig {

    @Bean
    CommandLineRunner setupInicial(UsuarioRepository repository, UsuarioService service) {
        return args -> {
            if (repository.count() == 0) {
                System.out.println(">>> Banco vazio detectado. Criando administrador inicial...");

                Usuario admin = new Usuario();
                admin.setNomeUsuario("Administrador");
                admin.setEmail("admin@cultiva.com");
                admin.setSenha("Admin@123");
                admin.setFuncao(FuncaoUsuario.ADMINISTRADOR);
                admin.setAtivo(true);

                service.criarUsuario(admin);

                System.out.println(">>> Usuário admin@cultiva.com criado com sucesso!");
            }
        };
    }
}