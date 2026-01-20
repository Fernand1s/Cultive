package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.DoencaPragaDTO;
import br.com.cultiva.cultivamais.dto.IrrigacaoDTO;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.cultiva.cultivamais.model.DoencaPraga;
import br.com.cultiva.cultivamais.model.Irrigacao;
import br.com.cultiva.cultivamais.service.EventoService;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    private final EventoService eventoService;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public EventoController(EventoService eventoService, LogService logService, SecurityUtils securityUtils) {
        this.eventoService = eventoService;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    // REGISTRAR IRRIGAÇÃO
    @PostMapping("/irrigacao/{idCultivo}")
    public ResponseEntity<Irrigacao> registrarIrrigacao(
            @PathVariable Long idCultivo,
            @Valid @RequestBody IrrigacaoDTO dto) {

        Irrigacao irrigacao = eventoService.registrarIrrigacao(idCultivo, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Registrou irrigação de " + irrigacao.getVolumeAgua() + "L no cultivo ID: " + idCultivo);

        return ResponseEntity.ok(irrigacao);
    }

    // REGISTRAR DOENÇA/PRAGA
    @PostMapping("/praga/{idCultivo}")
    public ResponseEntity<DoencaPraga> registrarPraga(
            @PathVariable Long idCultivo,
            @Valid @RequestBody DoencaPragaDTO dto) {

        DoencaPraga praga = eventoService.registrarDoencaPraga(idCultivo, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Registrou praga/doença: " + praga.getNomePragaOuDoenca() + " no cultivo ID: " + idCultivo);

        return ResponseEntity.ok(praga);
    }

    // LISTAR IRRIGAÇÕES POR CULTIVO
    @GetMapping("/irrigacao/cultivo/{idCultivo}")
    public ResponseEntity<List<Irrigacao>> listarIrrigacoes(@PathVariable Long idCultivo) {
        return ResponseEntity.ok(eventoService.listarIrrigacoesPorCultivo(idCultivo));
    }

    // LISTAR PRAGAS POR CULTIVO
    @GetMapping("/praga/cultivo/{idCultivo}")
    public ResponseEntity<List<DoencaPraga>> listarPragas(@PathVariable Long idCultivo) {
        return ResponseEntity.ok(eventoService.listarPragasPorCultivo(idCultivo));
    }

    // EXCLUIR IRRIGAÇÃO
    @DeleteMapping("/irrigacao/{idEvento}")
    public ResponseEntity<Void> excluirIrrigacao(@PathVariable Long idEvento) {
        eventoService.excluirIrrigacao(idEvento);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(), "Excluiu registro de irrigação ID: " + idEvento);

        return ResponseEntity.noContent().build();
    }

    // EXCLUIR PRAGA
    @DeleteMapping("/praga/{idEvento}")
    public ResponseEntity<Void> excluirPraga(@PathVariable Long idEvento) {
        eventoService.excluirPraga(idEvento);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(), "Excluiu registro de praga ID: " + idEvento);

        return ResponseEntity.noContent().build();
    }

    // ATUALIZAR IRRIGAÇÃO
    @PutMapping("/irrigacao/{idEvento}")
    public ResponseEntity<Irrigacao> atualizarIrrigacao(
            @PathVariable Long idEvento,
            @Valid @RequestBody IrrigacaoDTO dto) {

        Irrigacao atualizada = eventoService.atualizarIrrigacao(idEvento, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(), "Editou irrigação ID: " + idEvento);

        return ResponseEntity.ok(atualizada);
    }

    // ATUALIZAR PRAGA
    @PutMapping("/praga/{idEvento}")
    public ResponseEntity<DoencaPraga> atualizarPraga(
            @PathVariable Long idEvento,
            @Valid @RequestBody DoencaPragaDTO dto) {

        DoencaPraga atualizada = eventoService.atualizarPraga(idEvento, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(), "Editou registro de praga ID: " + idEvento);

        return ResponseEntity.ok(atualizada);
    }
}