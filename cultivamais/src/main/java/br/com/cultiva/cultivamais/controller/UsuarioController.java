package br.com.cultiva.cultivamais.controller;

import java.util.List;
import java.util.Map;

import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import br.com.cultiva.cultivamais.dto.UsuarioCadastroDTO;
import br.com.cultiva.cultivamais.dto.UsuarioUpdateDTO;
import br.com.cultiva.cultivamais.dto.LoginRequest;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final LogService logService;
    private final JwtService jwtService;
    private final SecurityUtils securityUtils;

    public UsuarioController(UsuarioService usuarioService, LogService logService,
                             JwtService jwtService, SecurityUtils securityUtils) {
        this.usuarioService = usuarioService;
        this.logService = logService;
        this.jwtService = jwtService;
        this.securityUtils = securityUtils;
    }

    // BUSCAR USUÁRIO POR ID (Protegendo a senha no retorno)
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscar(@PathVariable Long id) {
        Usuario usuario = usuarioService.buscarPorId(id);
        usuario.setSenha(null);
        return ResponseEntity.ok(usuario);
    }

    // CRIAR NOVO USUÁRIO
    @PostMapping
    public ResponseEntity<Usuario> criar(@Valid @RequestBody UsuarioCadastroDTO dto) {
        Usuario u = new Usuario();
        u.setNomeUsuario(dto.getNomeUsuario());
        u.setEmail(dto.getEmail());
        u.setSenha(dto.getSenha());
        u.setFuncao(dto.getFuncao());

        Usuario salvo = usuarioService.criarUsuario(u);
        salvo.setSenha(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // LISTAR TODOS OS USUÁRIOS
    @GetMapping
    public ResponseEntity<List<Usuario>> listar() {
        List<Usuario> usuarios = usuarioService.listarTodos();
        usuarios.forEach(u -> u.setSenha(null));
        return ResponseEntity.ok(usuarios);
    }

    // ATUALIZAR USUÁRIO (Inclui lógica de Bloqueio/Desbloqueio para o Log)
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioUpdateDTO dto) {

        Usuario antigo = usuarioService.buscarPorId(id);
        boolean eraAtivo = antigo.getAtivo();

        Usuario dadosParaAtualizar = new Usuario();
        dadosParaAtualizar.setNomeUsuario(dto.getNomeUsuario());
        dadosParaAtualizar.setEmail(dto.getEmail());
        dadosParaAtualizar.setFuncao(dto.getFuncao());
        dadosParaAtualizar.setAtivo(dto.getAtivo());

        Usuario atualizado = usuarioService.atualizarUsuario(id, dadosParaAtualizar);

        // Define a ação para o Log de auditoria
        String operador = securityUtils.getNomeUsuarioLogado();
        String acao = "Editou usuário " + atualizado.getNomeUsuario();

        if (eraAtivo && !atualizado.getAtivo()) {
            acao = "Bloqueou usuário " + atualizado.getNomeUsuario();
        } else if (!eraAtivo && atualizado.getAtivo()) {
            acao = "Desbloqueou usuário " + atualizado.getNomeUsuario();
        }

        logService.registrarLog(operador, acao);
        atualizado.setSenha(null);
        return ResponseEntity.ok(atualizado);
    }

    // EXCLUIR USUÁRIO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Usuario alvo = usuarioService.buscarPorId(id);
        usuarioService.excluirUsuario(id);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Excluiu usuário permanentemente: " + alvo.getNomeUsuario());

        return ResponseEntity.noContent().build();
    }

    // AUTENTICAÇÃO E GERAÇÃO DE TOKEN JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Usuario logado = usuarioService.autenticar(req.getEmail(), req.getSenha());

        if (logado != null) {
            String token = jwtService.generateToken(logado);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "idUsuario", logado.getIdUsuario(),
                    "nomeUsuario", logado.getNomeUsuario(),
                    "funcao", logado.getFuncao(),
                    "email", logado.getEmail(),
                    "ativo", logado.getAtivo()
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos.");
    }

    // GERAR CÓDIGO DE RECUPERAÇÃO DE SENHA
    @PostMapping("/gerar-codigo")
    public ResponseEntity<Map<String, String>> gerarCodigo(@RequestBody Map<String, String> payload) {
        String codigo = usuarioService.gerarCodigoRecuperacao(payload.get("email"));
        return codigo != null ? ResponseEntity.ok(Map.of("codigo", codigo)) : ResponseEntity.badRequest().build();
    }

    // REDEFINIR SENHA USANDO O CÓDIGO
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Void> redefinir(@RequestBody Map<String, String> payload) {
        boolean sucesso = usuarioService.redefinirSenhaComCodigo(
                payload.get("email"), payload.get("codigo"), payload.get("novaSenha"));
        return sucesso ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}