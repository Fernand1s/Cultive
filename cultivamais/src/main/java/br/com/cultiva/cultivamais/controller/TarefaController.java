package br.com.cultiva.cultivamais.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.cultiva.cultivamais.model.Tarefa;
import br.com.cultiva.cultivamais.service.TarefaService;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    @Autowired
    private TarefaService tarefaService;

    // LISTAR TAREFAS
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required=false) Long idUsuario, @RequestParam(required=false) String funcao) {
        try {
            if (idUsuario == null || funcao == null) {
                List<Tarefa> todas = tarefaService.listarTodas();
                return ResponseEntity.ok(todas);
            }

            List<Tarefa> lista = tarefaService.listarTarefasPorUsuario(idUsuario, funcao);
            return ResponseEntity.ok(lista);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro interno: " + e.getMessage());
        }
    }

    // CRIAR TAREFA
    @PostMapping
    public Tarefa criar(@RequestParam Long idCriador, @RequestParam(required=false) Long idResponsavel, @RequestBody Tarefa tarefa) {
        Long resp = (idResponsavel != null) ? idResponsavel : idCriador;
        return tarefaService.criarTarefa(idCriador, resp, tarefa);
    }

    // EDITAR TAREFA
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody Tarefa tarefa,
            @RequestParam Long idUsuarioLogado) {

        try {
            Tarefa atualizada = tarefaService.atualizarTarefa(id, tarefa, idUsuarioLogado);
            return ResponseEntity.ok(atualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // CONCLUIR TAREFA
    @PutMapping("/{id}/concluir")
    public ResponseEntity<Tarefa> concluir(
            @PathVariable Long id,
            @RequestParam Long idUsuarioLogado,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        String obs = (payload != null) ? payload.get("observacao") : "";
        Tarefa t = tarefaService.concluirTarefa(id, idUsuarioLogado, obs);

        if (t != null) return ResponseEntity.ok(t);
        return ResponseEntity.badRequest().build();
    }

    // CANCELAR TAREFA
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Tarefa> cancelar(@PathVariable Long id, @RequestParam Long idUsuarioLogado) {
        Tarefa t = tarefaService.cancelarTarefa(id, idUsuarioLogado);
        if (t != null) return ResponseEntity.ok(t);
        return ResponseEntity.status(403).body(null);
    }

    // EXCLUIR TAREFA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, @RequestParam Long idUsuarioLogado) {
        boolean sucesso = tarefaService.excluirTarefa(id, idUsuarioLogado);
        if (sucesso) return ResponseEntity.noContent().build();
        return ResponseEntity.status(403).build();
    }
}