package br.com.cultiva.cultivamais.controller;

import java.util.List;

import br.com.cultiva.cultivamais.dto.CultivoRequestDTO;
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

    // CRIAR CULTIVO
    @PostMapping
    public ResponseEntity<Cultivo> criarCultivo(@Valid @RequestBody CultivoRequestDTO dto) {
        Cultivo cultivoSalvo = cultivoService.criarCultivo(
                dto.getIdPlanta(),
                dto.getIdArea(),
                dto.getQuantidadePlantada(),
                dto.getDataPlantio()
        );

        // REGISTRO DE LOG COM NOME DO USUÁRIO LOGADO
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Iniciou cultivo de " + cultivoSalvo.getPlanta().getNomePopular() +
                        " na área " + cultivoSalvo.getAreaCultivo().getNomeArea());

        return ResponseEntity.ok(cultivoSalvo);
    }

    // LISTAR CULTIVOS
    @GetMapping
    public ResponseEntity<List<Cultivo>> listarCultivos() {
        List<Cultivo> lista = cultivoService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    // EXCLUIR CULTIVO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirCultivo(@PathVariable Long id) {
        Cultivo cultivo = cultivoService.buscarPorId(id);
        String nomePlanta = cultivo.getPlanta().getNomePopular();

        cultivoService.excluirCultivo(id);

        // REGISTRO DE LOG COM NOME DO USUÁRIO LOGADO
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Removeu cultivo de " + nomePlanta + " (ID: " + id + ")");

        return ResponseEntity.noContent().build();
    }

    // EDITAR CULTIVOS
    @PutMapping("/{id}")
    public ResponseEntity<Cultivo> atualizarCultivo(@PathVariable Long id, @Valid @RequestBody CultivoRequestDTO dto) {
        Cultivo cultivoAtualizado = cultivoService.atualizarCultivo(id, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Atualizou o cultivo de " + cultivoAtualizado.getPlanta().getNomePopular());

        if (cultivoAtualizado.getEstadoPlanta() == EstadoPlanta.CRITICO) {
            logService.registrarLog("ALERTA SISTEMA",
                    "O cultivo ID " + id + " entrou em estado CRÍTICO!");
        }

        return ResponseEntity.ok(cultivoAtualizado);
    }
}