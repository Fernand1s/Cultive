package br.com.cultiva.cultivamais.service;

import java.util.List;
import java.util.UUID;

import br.com.cultiva.cultivamais.model.UsuarioTenant;
import br.com.cultiva.cultivamais.multitenant.TenantContext;
import br.com.cultiva.cultivamais.multitenant.TenantIdentifierResolver;
import br.com.cultiva.cultivamais.repository.UsuarioTenantRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.NotificacaoRepository;
import br.com.cultiva.cultivamais.repository.TarefaRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import io.micrometer.common.lang.NonNull;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioTenantRepository usuarioTenantRepository;
    private final LogService logService;
    private final PasswordEncoder passwordEncoder;
    private final NotificacaoService notificacaoService;
    private final NotificacaoRepository notificacaoRepository;
    private final TarefaRepository tarefaRepository;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          UsuarioTenantRepository usuarioTenantRepository,
                          LogService logService,
                          PasswordEncoder passwordEncoder,
                          NotificacaoService notificacaoService,
                          NotificacaoRepository notificacaoRepository,
                          TarefaRepository tarefaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioTenantRepository = usuarioTenantRepository;
        this.logService = logService;
        this.passwordEncoder = passwordEncoder;
        this.notificacaoService = notificacaoService;
        this.notificacaoRepository = notificacaoRepository;
        this.tarefaRepository = tarefaRepository;
    }

    // BUSCAR POR ID
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + id));
    }

    // CRIAR USUÁRIO
    @Transactional
    public Usuario criarUsuario(@NonNull Usuario novoUsuario) {
        try {
            novoUsuario.setSenha(passwordEncoder.encode(novoUsuario.getSenha()));

            if (novoUsuario.getAtivo() == null) {
                novoUsuario.setAtivo(true);
            }

            Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);

            // Registra o mapeamento email → schema no schema público (SQL schema-qualified)
            String tenantAtual = TenantContext.getCurrentTenant();
            String schema = (tenantAtual != null && !tenantAtual.isBlank())
                    ? tenantAtual : TenantIdentifierResolver.DEFAULT_TENANT;
            usuarioTenantRepository.save(new UsuarioTenant(usuarioSalvo.getEmail(), schema));

            logService.registrarLog("SISTEMA", "Criou novo usuário: " + usuarioSalvo.getNomeUsuario());

            try {
                notificacaoService.criarNotificacao(
                        usuarioSalvo.getIdUsuario(),
                        "Bem-vindo ao Cultiva+!",
                        "Seu perfil de " + usuarioSalvo.getFuncao() + " foi ativado com sucesso.",
                        "sucesso"
                );

                notificarAdministradores(
                        "Novo Cadastro no Sistema",
                        "O usuário " + usuarioSalvo.getNomeUsuario() + " registrado como " + usuarioSalvo.getFuncao(),
                        "info"
                );
            } catch (Exception e) {
                System.err.println("Erro ao processar notificações: " + e.getMessage());
            }

            return usuarioSalvo;

        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro: O e-mail informado já está cadastrado no sistema.");
        }
    }

    // LISTAR TODOS
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    // ATUALIZAR USUÁRIO
    @Transactional
    public Usuario atualizarUsuario(Long id, Usuario dadosAtualizados) {
        Usuario usuario = buscarPorId(id);
        boolean senhaAlterada = false;

        if (dadosAtualizados.getNomeUsuario() != null && !dadosAtualizados.getNomeUsuario().isBlank()) {
            usuario.setNomeUsuario(dadosAtualizados.getNomeUsuario());
        }
        if (dadosAtualizados.getEmail() != null && !dadosAtualizados.getEmail().isBlank()) {
            usuario.setEmail(dadosAtualizados.getEmail());
        }
        if (dadosAtualizados.getFuncao() != null) {
            usuario.setFuncao(dadosAtualizados.getFuncao());
        }
        if (dadosAtualizados.getAtivo() != null) {
            usuario.setAtivo(dadosAtualizados.getAtivo());
        }
        if (dadosAtualizados.getSenha() != null && !dadosAtualizados.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(dadosAtualizados.getSenha()));
            senhaAlterada = true;
        }
        if (dadosAtualizados.getFotoPerfil() != null) {
            usuario.setFotoPerfil(dadosAtualizados.getFotoPerfil());
        }

        Usuario salvo = usuarioRepository.save(usuario);

        if (senhaAlterada) {
            notificacaoService.criarNotificacao(salvo.getIdUsuario(), "Senha Atualizada",
                    "Sua senha foi alterada via edição de perfil.", "alerta");
        }

        return salvo;
    }

    // EXCLUIR USUÁRIO
    @Transactional
    public void excluirUsuario(@NonNull Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + id));

        // 1. Remove as notificações do usuário (são pessoais)
        notificacaoRepository.deleteByUsuarioId(id);

        // 2. Preserva as tarefas que ele criou, apenas desvinculando o criador
        tarefaRepository.desvincularCriador(id);

        // 3. Remove o mapeamento email→schema no schema público
        usuarioTenantRepository.findByEmail(usuario.getEmail())
                .ifPresent(usuarioTenantRepository::delete);

        // 4. Remove o usuário (cascade ALL apaga as tarefas atribuídas a ele)
        usuarioRepository.delete(usuario);

        logService.registrarLog("SISTEMA", "Excluiu o usuário: " + usuario.getNomeUsuario());
    }

    // AUTENTICAR USUÁRIO
    public Usuario autenticar(String email, String senhaPlana) {
        // Descobre em qual schema o usuário está antes de buscar os dados completos
        UsuarioTenant mapeamento = usuarioTenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        TenantContext.setCurrentTenant(mapeamento.getTenantSchema());
        // TenantContext é limpo pelo SecurityFilter no finally após a requisição completa

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (passwordEncoder.matches(senhaPlana, usuario.getSenha())) {
            if (Boolean.TRUE.equals(usuario.getAtivo())) {
                logService.registrarLog(usuario.getNomeUsuario(), "Realizou Login");
                return usuario;
            }
        }
        return null;
    }

    // GERAR CÓDIGO PARA RECUPERAÇÃO
    @Transactional
    public String gerarCodigoRecuperacao(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String codigo = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        usuario.setCodigoRecuperacao(codigo);
        usuarioRepository.save(usuario);
        return codigo;
    }

    // REDEFINIR SENHA
    @Transactional
    public boolean redefinirSenhaComCodigo(String email, String codigoInput, String novaSenha) {
        // Resolve o schema do tenant via tabela pública antes de buscar o usuário
        // (necessário quando chamado sem autenticação, ex: tela de Login)
        usuarioTenantRepository.findByEmail(email).ifPresent(m ->
                TenantContext.setCurrentTenant(m.getTenantSchema()));

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (usuario.getCodigoRecuperacao() != null && usuario.getCodigoRecuperacao().equals(codigoInput)) {
            usuario.setSenha(passwordEncoder.encode(novaSenha));
            usuario.setCodigoRecuperacao(null);
            usuarioRepository.save(usuario);
            logService.registrarLog(email, "Redefiniu a senha com sucesso via código.");
            return true;
        }
        return false;
    }

    // METODO AUXILIAR PARA NOTIFICAR ADMINISTRADORES
    private void notificarAdministradores(String titulo, String mensagem, String tipo) {
        usuarioRepository.findAll().stream()
                .filter(u -> u.getFuncao() != null)
                .filter(u -> u.getFuncao().name().toUpperCase().contains("ADMIN")
                        || u.getFuncao().name().toUpperCase().contains("EMPRESA"))
                .forEach(u -> notificacaoService.criarNotificacao(u.getIdUsuario(), titulo, mensagem, tipo));
    }
}