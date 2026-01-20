package br.com.cultiva.cultivamais.service;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import io.micrometer.common.lang.NonNull;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final LogService logService;
    private final PasswordEncoder passwordEncoder;
    private final NotificacaoService notificacaoService;

    public UsuarioService(UsuarioRepository usuarioRepository, LogService logService,
                          PasswordEncoder passwordEncoder, NotificacaoService notificacaoService) {
        this.usuarioRepository = usuarioRepository;
        this.logService = logService;
        this.passwordEncoder = passwordEncoder;
        this.notificacaoService = notificacaoService;
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
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuário não encontrado com ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    // AUTENTICAR USUÁRIO
    public Usuario autenticar(String email, String senhaPlana) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (usuario != null && passwordEncoder.matches(senhaPlana, usuario.getSenha())) {
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

        if (usuario != null) {
            String codigo = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            usuario.setCodigoRecuperacao(codigo);
            usuarioRepository.save(usuario);
            return codigo;
        }
        return null;
    }

    // REDEFINIR SENHA
    @Transactional
    public boolean redefinirSenhaComCodigo(String email, String codigoInput, String novaSenha) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (usuario != null && usuario.getCodigoRecuperacao() != null
                && usuario.getCodigoRecuperacao().equals(codigoInput)) {

            usuario.setSenha(passwordEncoder.encode(novaSenha));
            usuario.setCodigoRecuperacao(null);
            usuarioRepository.save(usuario);

            logService.registrarLog(email, "Redefiniu a senha com sucesso via código.");
            return true;
        }
        return false;
    }

    // MÉTODO AUXILIAR PARA NOTIFICAR ADMINISTRADORES
    private void notificarAdministradores(String titulo, String mensagem, String tipo) {
        usuarioRepository.findAll().stream()
                .filter(u -> u.getFuncao() != null)
                .filter(u -> u.getFuncao().name().toUpperCase().contains("ADMIN")
                        || u.getFuncao().name().toUpperCase().contains("EMPRESA"))
                .forEach(u -> notificacaoService.criarNotificacao(u.getIdUsuario(), titulo, mensagem, tipo));
    }
}