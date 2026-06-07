package br.com.cultiva.cultivamais.controller;

import java.util.List;

import br.com.cultiva.cultivamais.dto.ColheitaDTO;
import br.com.cultiva.cultivamais.dto.CultivoRequestDTO;
import br.com.cultiva.cultivamais.dto.EncerrarCultivoDTO;
import br.com.cultiva.cultivamais.model.Colheita;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.cultiva.cultivamais.model.Cultivo;
import br.com.cultiva.cultivamais.model.EstadoPlanta;
import br.com.cultiva.cultivamais.service.CultivoService;

@RestController
@RequestMapping("/api/cultivos")
public class CultivoController {

    private final CultivoService cultivoService;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public CultivoController(CultivoService cultivoService,
                             LogService logService,
                             SecurityUtils securityUtils) {
        this.cultivoService = cultivoService;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    @PostMapping
    public ResponseEntity<Cultivo> criarCultivo(@Valid @RequestBody CultivoRequestDTO dto) {
        Cultivo cultivoSalvo = cultivoService.criarCultivoDtoCompleto(
                dto.getIdPlanta(), dto.getIdArea(),
                dto.getQuantidadePlantada(), dto.getDataPlantio(), dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Iniciou cultivo de " + cultivoSalvo.getPlanta().getNomePopular()
                + " na área " + cultivoSalvo.getAreaCultivo().getNomeArea());

        return ResponseEntity.ok(cultivoSalvo);
    }

    @GetMapping
    public ResponseEntity<List<Cultivo>> listarCultivos() {
        return ResponseEntity.ok(cultivoService.listarTodos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirCultivo(@PathVariable Long id) {
        Cultivo cultivo = cultivoService.buscarPorId(id);
        String nomePlanta = cultivo.getPlanta().getNomePopular();
        cultivoService.excluirCultivo(id);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Removeu cultivo de " + nomePlanta + " (ID: " + id + ")");
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cultivo> atualizarCultivo(@PathVariable Long id, @Valid @RequestBody CultivoRequestDTO dto) {
        Cultivo cultivoAtualizado = cultivoService.atualizarCultivo(id, dto);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Atualizou o cultivo de " + cultivoAtualizado.getPlanta().getNomePopular());
        if (cultivoAtualizado.getEstadoPlanta() == EstadoPlanta.CRITICO) {
            logService.registrarLog("ALERTA SISTEMA", "O cultivo ID " + id + " entrou em estado CRÍTICO!");
        }
        return ResponseEntity.ok(cultivoAtualizado);
    }

    // REGISTRAR COLHEITA / APANHA
    @PostMapping("/{id}/colheita")
    public ResponseEntity<Colheita> registrarColheita(@PathVariable Long id,
                                                       @RequestBody ColheitaDTO dto) {
        dto.setIdUsuario(securityUtils.getIdUsuarioLogado());
        Colheita colheita = cultivoService.registrarColheita(id, dto);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Registrou colheita de " + dto.getQuantidadeColhida()
                + " " + dto.getUnidadeMedida() + " no cultivo ID: " + id);
        return ResponseEntity.ok(colheita);
    }

    // LISTAR COLHEITAS DE UM CULTIVO
    @GetMapping("/{id}/colheitas")
    public ResponseEntity<List<Colheita>> listarColheitas(@PathVariable Long id) {
        return ResponseEntity.ok(cultivoService.listarColheitas(id));
    }

    // ENCERRAR SAFRA
    @PostMapping("/{id}/encerrar")
    public ResponseEntity<Cultivo> encerrarCultivo(@PathVariable Long id,
                                                    @RequestBody EncerrarCultivoDTO dto) {
        dto.setIdUsuario(securityUtils.getIdUsuarioLogado());
        Cultivo encerrado = cultivoService.encerrarCultivo(id, dto);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Encerrou safra do cultivo ID: " + id + " - Motivo: " + dto.getMotivoEncerramento());
        return ResponseEntity.ok(encerrado);
    }
}
