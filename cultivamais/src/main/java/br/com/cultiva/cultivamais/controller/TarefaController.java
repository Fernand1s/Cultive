package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.TarefaDTO;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.TarefaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    private final TarefaService tarefaService;
    private final SecurityUtils securityUtils;
    private final LogService logService;

    public TarefaController(TarefaService tarefaService, SecurityUtils securityUtils, LogService logService) {
        this.tarefaService = tarefaService;
        this.securityUtils = securityUtils;
        this.logService = logService;
    }

    // LISTAR TAREFAS (COM FILTRO POR USUÁRIO OU FUNÇÃO)
    @GetMapping
    public ResponseEntity<List<TarefaDTO>> listar(@RequestParam(required = false) Long idUsuario, @RequestParam(required = false) String funcao) {
        if (idUsuario == null) {
            return ResponseEntity.ok(tarefaService.listarTodas());
        }
        return ResponseEntity.ok(tarefaService.listarTarefasPorUsuario(idUsuario, funcao));
    }

    // CRIAR NOVA TAREFA
    @PostMapping
    public ResponseEntity<TarefaDTO> criar(@RequestParam(required = false) Long idResponsavel, @RequestBody TarefaDTO dto) {
        Long idCriador = securityUtils.getIdUsuarioLogado();
        TarefaDTO novaTarefa = tarefaService.criarTarefa(idCriador, idResponsavel, dto);
        return ResponseEntity.ok(novaTarefa);
    }

    // ATUALIZAR TAREFA
    @PutMapping("/{id}")
    public ResponseEntity<TarefaDTO> atualizar(@PathVariable Long id, @RequestBody TarefaDTO dto) {
        Long idUsuarioLogado = securityUtils.getIdUsuarioLogado();
        return ResponseEntity.ok(tarefaService.atualizarTarefa(id, dto, idUsuarioLogado));
    }

    // CONCLUIR OU REABRIR TAREFA
    @PatchMapping("/{id}/concluir")
    public ResponseEntity<TarefaDTO> concluir(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        Long idUsuarioLogado = securityUtils.getIdUsuarioLogado();
        String obs = (payload != null) ? payload.get("observacao") : "";
        return ResponseEntity.ok(tarefaService.concluirTarefa(id, idUsuarioLogado, obs));
    }

    // CANCELAR TAREFA
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<TarefaDTO> cancelar(@PathVariable Long id) {
        Long idUsuarioLogado = securityUtils.getIdUsuarioLogado();
        return ResponseEntity.ok(tarefaService.cancelarTarefa(id, idUsuarioLogado));
    }

    // EXCLUIR TAREFA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Long idUsuarioLogado = securityUtils.getIdUsuarioLogado();
        tarefaService.excluirTarefa(id, idUsuarioLogado);
        return ResponseEntity.noContent().build();
    }
}