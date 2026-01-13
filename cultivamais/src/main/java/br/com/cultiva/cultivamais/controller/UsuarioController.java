package br.com.cultiva.cultivamais.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import br.com.cultiva.cultivamais.dto.UsuarioCadastroDTO;
import br.com.cultiva.cultivamais.dto.LoginRequest;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    private final LogService logService;

    public UsuarioController(UsuarioService usuarioService, LogService logService) {
        this.usuarioService = usuarioService;
        this.logService = logService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Long id) {
        Usuario usuario = usuarioService.buscarPorId(id);

        if (usuario != null) {
            usuario.setSenha(null);
            return ResponseEntity.ok(usuario);
        }

        return ResponseEntity.notFound().build();
    }

    private String getUsuarioLogado() {
        return "Yuan Admin";
    }

    // CADASTRO COM VALIDAÇÃO E SEGURANÇA
    @PostMapping
    public ResponseEntity<Usuario> criarUsuario(@Valid @RequestBody UsuarioCadastroDTO usuarioDTO) {

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNomeUsuario(usuarioDTO.getNomeUsuario());
        novoUsuario.setEmail(usuarioDTO.getEmail());
        novoUsuario.setSenha(usuarioDTO.getSenha());
        novoUsuario.setFuncao(usuarioDTO.getFuncao());

        Usuario usuarioSalvo = usuarioService.criarUsuario(novoUsuario);

        return ResponseEntity.ok(usuarioSalvo);
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    // LÓGICA DE BLOQUEIO/DESBLOQUEIO
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuarioNovosDados) {

        Usuario usuarioAntigo = usuarioService.buscarPorId(id);

        if (usuarioAntigo == null) {
            return ResponseEntity.notFound().build();
        }

        boolean eraAtivo = Boolean.TRUE.equals(usuarioAntigo.getAtivo());
        Usuario atualizado = usuarioService.atualizarUsuario(id, usuarioNovosDados);
        boolean ficouAtivo = Boolean.TRUE.equals(atualizado.getAtivo());
        String acaoLog = "Editou \"" + atualizado.getNomeUsuario() + "\"";

        if (eraAtivo && !ficouAtivo) {
            acaoLog = "Bloqueou o usuário \"" + atualizado.getNomeUsuario() + "\"";
        } else if (!eraAtivo && ficouAtivo) {
            acaoLog = "Desbloqueou o usuário \"" + atualizado.getNomeUsuario() + "\"";
        }

        String ator = getUsuarioLogado();
        logService.registrarLog(ator, acaoLog);

        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirUsuario(@PathVariable Long id) {
        Usuario alvo = usuarioService.buscarPorId(id);
        String nomeAlvo = (alvo != null) ? alvo.getNomeUsuario() : "ID " + id;

        usuarioService.excluirUsuario(id);

        String ator = getUsuarioLogado();
        logService.registrarLog(ator, "Excluiu o usuário \"" + nomeAlvo + "\"");

        return ResponseEntity.noContent().build();
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<Usuario> login(@RequestBody LoginRequest loginRequest) {
        Usuario usuarioLogado = usuarioService.autenticar(
                loginRequest.getEmail(),
                loginRequest.getSenha()
        );

        if (usuarioLogado != null) {
            usuarioLogado.setSenha(null);
            return ResponseEntity.ok(usuarioLogado);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // GERAR CÓDIGO DE REDEFINIÇÃO DE SENHA
    @PostMapping("/gerar-codigo")
    public ResponseEntity<Map<String, String>> gerarCodigo(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String codigo = usuarioService.gerarCodigoRecuperacao(email);

        if (codigo != null) {
            return ResponseEntity.ok(Map.of("codigo", codigo));
        }
        return ResponseEntity.badRequest().build();
    }

    // REDEFINIR SENHA
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Void> redefinirSenha(@RequestBody Map<String, String> payload) {
        boolean sucesso = usuarioService.redefinirSenhaComCodigo(
                payload.get("email"), payload.get("codigo"), payload.get("novaSenha")
        );

        if (sucesso) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}