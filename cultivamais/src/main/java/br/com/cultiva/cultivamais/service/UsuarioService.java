package br.com.cultiva.cultivamais.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException; // IMPORTANTE: Para tratar e-mail duplicado
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.LogSistema;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.LogRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import io.micrometer.common.lang.NonNull;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final LogRepository logRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacaoService notificacaoService;

    public UsuarioService(UsuarioRepository usuarioRepository, LogRepository logRepository, PasswordEncoder passwordEncoder, NotificacaoService notificacaoService) {
        this.usuarioRepository = usuarioRepository;
        this.logRepository = logRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificacaoService = notificacaoService;
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id).orElse(null);
    }

    // CRIAR UTILIZADOR
    @Transactional
    @SuppressWarnings("null")
    public Usuario criarUsuario(@NonNull Usuario novoUsuario) {
        try {
            String senhaCriptografada = passwordEncoder.encode(novoUsuario.getSenha());
            novoUsuario.setSenha(senhaCriptografada);

            if (novoUsuario.getAtivo() == null) {
                novoUsuario.setAtivo(true);
            }

            Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);

            logRepository.save(new LogSistema("Sistema", "Criou novo usuário: " + usuarioSalvo.getNomeUsuario()));

            try {
                notificacaoService.criarNotificacao(
                        usuarioSalvo.getIdUsuario(),
                        "Bem-vindo ao Cultiva+!",
                        "Seu perfil de " + usuarioSalvo.getFuncao() + " foi ativado com sucesso.",
                        "sucesso"
                );

                notificarAdministradores(
                        "Novo Cadastro no Sistema",
                        "O usuário " + usuarioSalvo.getNomeUsuario() + " (" + usuarioSalvo.getFuncao() + ") acabou de se registrar.",
                        "info"
                );
            } catch (Exception e) {
                System.err.println("Erro ao enviar notificação de boas-vindas (ignorado): " + e.getMessage());
            }

            return usuarioSalvo;

        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro: O e-mail informado já está cadastrado no sistema.");
        }
    }

    // LISTAR USUÁRIOS
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    // EDITAR USUÁRIOS
    public Usuario atualizarUsuario(Long id, Usuario dadosAtualizados) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findById(id);

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();
            boolean senhaAlterada = false;

            if (dadosAtualizados.getNomeUsuario() != null && !dadosAtualizados.getNomeUsuario().isEmpty()) {
                usuario.setNomeUsuario(dadosAtualizados.getNomeUsuario());
            }
            if (dadosAtualizados.getEmail() != null && !dadosAtualizados.getEmail().isEmpty()) {
                usuario.setEmail(dadosAtualizados.getEmail());
            }
            if (dadosAtualizados.getFuncao() != null) {
                usuario.setFuncao(dadosAtualizados.getFuncao());
            }
            if (dadosAtualizados.getAtivo() != null) {
                usuario.setAtivo(dadosAtualizados.getAtivo());
            }

            if (dadosAtualizados.getSenha() != null && !dadosAtualizados.getSenha().isEmpty()) {
                String novaSenhaHash = passwordEncoder.encode(dadosAtualizados.getSenha());
                usuario.setSenha(novaSenhaHash);
                senhaAlterada = true;
            }

            Usuario salvo = usuarioRepository.save(usuario);

            if (senhaAlterada) {
                try {
                    notificacaoService.criarNotificacao(
                            salvo.getIdUsuario(),
                            "Senha Atualizada",
                            "Sua senha foi alterada através da edição de perfil.",
                            "alerta"
                    );
                } catch (Exception e) {
                    System.err.println("Erro notificação senha: " + e.getMessage());
                }
            }

            return salvo;

        } else {
            throw new ResourceNotFoundException("Usuário não encontrado com ID: " + id);
        }
    }

    // EXCLUIR USUÁRIO
    @SuppressWarnings("null")
    public void excluirUsuario(@NonNull Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuário não encontrado com ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    // --- AUTENTICAÇÃO COM BCRYPT ---
    public Usuario autenticar(String email, String senhaPlana) {
        Usuario usuario = usuarioRepository.findByEmail(email);

        if (usuario != null) {
            if (passwordEncoder.matches(senhaPlana, usuario.getSenha())) {

                if (Boolean.TRUE.equals(usuario.getAtivo())) {
                    logRepository.save(new LogSistema(usuario.getNomeUsuario(), "Realizou Login"));
                    return usuario;
                }
            }
        }
        return null;
    }

    // GERAR CÓDIGO DE RECUPERAÇÃO DE SENHA
    public String gerarCodigoRecuperacao(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email);

        if (usuario != null) {
            String codigo = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            usuario.setCodigoRecuperacao(codigo);
            usuarioRepository.save(usuario);
            logRepository.save(new LogSistema(email, "Solicitou código de recuperação de senha"));
            return codigo;
        }
        return null;
    }

    // REDEFINIR SENHA
    public boolean redefinirSenhaComCodigo(String email, String codigoInput, String novaSenha) {
        Usuario usuario = usuarioRepository.findByEmail(email);

        if (usuario != null) {
            String codigoSalvo = usuario.getCodigoRecuperacao();

            if (codigoSalvo != null && codigoSalvo.equals(codigoInput)) {

                usuario.setSenha(passwordEncoder.encode(novaSenha));

                usuario.setCodigoRecuperacao(null);
                usuarioRepository.save(usuario);
                logRepository.save(new LogSistema(email, "Redefiniu a senha com sucesso"));

                try {
                    notificacaoService.criarNotificacao(
                            usuario.getIdUsuario(),
                            "Senha Alterada",
                            "Sua senha foi redefinida. Se não foi você, contate o suporte.",
                            "alerta"
                    );

                    notificarAdministradores(
                            "Segurança: Redefinição de Senha",
                            "O usuário " + usuario.getNomeUsuario() + " (" + email + ") redefiniu a senha via código.",
                            "info"
                    );
                } catch (Exception e) {
                    System.err.println("Erro notificação recuperação: " + e.getMessage());
                }

                return true;
            }
        }
        return false;
    }

    // NOTIFICA OS ADMIN
    private void notificarAdministradores(String titulo, String mensagem, String tipo) {
        List<Usuario> todos = usuarioRepository.findAll();
        for (Usuario u : todos) {
            if (u.getFuncao() != null) {
                String funcao = u.getFuncao().name().toUpperCase();
                if (funcao.contains("ADMIN") || funcao.contains("EMPRESA")) {
                    notificacaoService.criarNotificacao(u.getIdUsuario(), titulo, mensagem, tipo);
                }
            }
        }
    }
}