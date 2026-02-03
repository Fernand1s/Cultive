package br.com.cultiva.cultivamais.controller;

import java.util.List;

import br.com.cultiva.cultivamais.dto.PlantaDTO;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.PlantaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plantas")
public class PlantaController {

    private final PlantaService plantaService;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public PlantaController(PlantaService plantaService, LogService logService, SecurityUtils securityUtils) {
        this.plantaService = plantaService;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    // CRIAR PLANTA
    @PostMapping
    public ResponseEntity<PlantaDTO> criar(@Valid @RequestBody PlantaDTO dto) {
        Long idUsuarioLogado = securityUtils.getIdUsuarioLogado();
        String nomeUsuario = securityUtils.getNomeUsuarioLogado();

        if (idUsuarioLogado == null) {
            return ResponseEntity.status(401).build();
        }

        PlantaDTO plantaSalva = plantaService.criarPlanta(idUsuarioLogado, dto);

        logService.registrarLog(nomeUsuario, "Cadastrou nova espécie: " + plantaSalva.getNomePopular());

        return ResponseEntity.ok(plantaSalva);
    }

    // LISTAR TODAS AS PLANTAS
    @GetMapping
    public ResponseEntity<List<PlantaDTO>> listar() {
        return ResponseEntity.ok(plantaService.listarTodas());
    }

    // ATUALIZAR PLANTA
    @PutMapping("/{id}")
    public ResponseEntity<PlantaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody PlantaDTO dto) {
        PlantaDTO plantaAtualizada = plantaService.atualizarPlanta(id, dto);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Atualizou dados da planta: " + plantaAtualizada.getNomePopular());

        return ResponseEntity.ok(plantaAtualizada);
    }

    // EXCLUIR PLANTA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        String nomePlanta = plantaService.buscarNomePlanta(id);

        plantaService.excluirPlanta(id);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Removeu a espécie: " + nomePlanta + " (ID: " + id + ")");

        return ResponseEntity.noContent().build();
    }
}