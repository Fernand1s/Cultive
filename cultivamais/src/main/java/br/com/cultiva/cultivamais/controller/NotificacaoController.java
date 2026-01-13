package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.model.Notificacao;
import br.com.cultiva.cultivamais.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;

    public NotificacaoController(NotificacaoService service) {
        this.service = service;
    }

    // DTO AUXILIAR PARA CRIAÇÃO
    public static class NotificacaoDTO {
        public Long idUsuario;
        public String titulo;
        public String mensagem;
        public String tipo;
    }

    // LISTAR NOTIFICAÇÕES DO USUÁRIO
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Notificacao>> listar(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(service.listarPorUsuario(idUsuario));
    }

    // CRIAR NOTIFICAÇÃO
    @PostMapping
    public ResponseEntity<Notificacao> criar(@RequestBody NotificacaoDTO dto) {
        Notificacao nova = service.criarNotificacao(dto.idUsuario, dto.titulo, dto.mensagem, dto.tipo);
        return ResponseEntity.ok(nova);
    }

    // MARCAR COMO LIDA
    @PutMapping("/{id}/lida")
    public ResponseEntity<Void> marcarLida(@PathVariable Long id) {
        service.marcarComoLida(id);
        return ResponseEntity.noContent().build();
    }

    // MARCAR TODAS COMO LIDA
    @PutMapping("/usuario/{idUsuario}/ler-todas")
    public ResponseEntity<Void> marcarTodasLidas(@PathVariable Long idUsuario) {
        service.marcarTodasComoLidas(idUsuario);
        return ResponseEntity.noContent().build();
    }

    // EXCLUIR NOTIFICAÇÃO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}