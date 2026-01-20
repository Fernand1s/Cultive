package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.NotificacaoDTO;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.NotificacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public NotificacaoController(NotificacaoService service, LogService logService, SecurityUtils securityUtils) {
        this.service = service;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    // LISTAR NOTIFICAÇÕES POR USUÁRIO
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<NotificacaoDTO>> listar(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(service.listarPorUsuario(idUsuario));
    }

    // CRIAR NOTIFICAÇÃO MANUALMENTE
    @PostMapping
    public ResponseEntity<NotificacaoDTO> criar(@RequestBody NotificacaoDTO dto) {
        NotificacaoDTO response = service.salvarERetornarDTO(dto);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Criou notificação manual: " + response.getTitulo());
        return ResponseEntity.ok(response);
    }

    // MARCAR UMA NOTIFICAÇÃO COMO LIDA
    @PatchMapping("/{id}/lida")
    public ResponseEntity<Void> marcarLida(@PathVariable Long id) {
        service.marcarComoLida(id);
        return ResponseEntity.noContent().build();
    }

    // MARCAR UMA NOTIFICAÇÃO COMO NÃO LIDA
    @PatchMapping("/{id}/nao-lida")
    public ResponseEntity<Void> marcarNaoLida(@PathVariable Long id) {
        service.marcarComoNaoLida(id);
        return ResponseEntity.noContent().build();
    }

    // MARCAR TODAS COMO LIDAS
    @PutMapping("/usuario/{idUsuario}/ler-todas")
    public ResponseEntity<Void> marcarTodasLidas(@PathVariable Long idUsuario) {
        service.marcarTodasComoLidas(idUsuario);
        return ResponseEntity.noContent().build();
    }

    // MARCAR TODAS COMO NÃO LIDAS
    @PutMapping("/usuario/{idUsuario}/desler-todas")
    public ResponseEntity<Void> marcarTodasNaoLidas(@PathVariable Long idUsuario) {
        service.marcarTodasComoNaoLidas(idUsuario);
        return ResponseEntity.noContent().build();
    }

    // EXCLUIR NOTIFICAÇÃO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Excluiu notificação ID: " + id);
        return ResponseEntity.noContent().build();
    }

    // CONTAR NOTIFICAÇÕES NÃO LIDAS
    @GetMapping("/usuario/{idUsuario}/contar-nao-lidas")
    public ResponseEntity<Long> contarNaoLidas(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(service.contarNaoLidas(idUsuario));
    }
}