package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.*;
import br.com.cultiva.cultivamais.security.SecurityUtils;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.service.RelatorioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public RelatorioController(RelatorioService relatorioService, LogService logService, SecurityUtils securityUtils) {
        this.relatorioService = relatorioService;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    // RELATÓRIO DE CONSUMO DE ÁGUA
    @GetMapping("/agua/{idCultivo}")
    public ResponseEntity<ConsumoAguaDTO> getRelatorioAgua(@PathVariable Long idCultivo) {
        ConsumoAguaDTO relatorio = relatorioService.calcularTotalAguaCultivo(idCultivo);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou relatório de consumo de água para o cultivo: " + relatorio.getPlanta());

        return ResponseEntity.ok(relatorio);
    }

    // VERIFICAR COMPATIBILIDADE ENTRE PLANTA E ÁREA
    @GetMapping("/compatibilidade/{idPlanta}/{idArea}")
    public ResponseEntity<CompatibilidadeDTO> getCompatibilidade(@PathVariable Long idPlanta, @PathVariable Long idArea) {
        return ResponseEntity.ok(relatorioService.verificarCompatibilidadeTotal(idPlanta, idArea));
    }

    // HISTÓRICO DE PRAGAS E DOENÇAS
    @GetMapping("/pragas/{idCultivo}")
    public ResponseEntity<List<HistoricoPragaDTO>> getHistoricoPragas(@PathVariable Long idCultivo) {
        List<HistoricoPragaDTO> historico = relatorioService.obterHistoricoPragasDTO(idCultivo);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou histórico fitossanitário (pragas) do cultivo ID: " + idCultivo);

        return ResponseEntity.ok(historico);
    }

    // TOTAL COLHIDO POR ÁREA
    @GetMapping("/colheita/{idArea}")
    public ResponseEntity<Double> getTotalColhido(@PathVariable Long idArea) {
        Double total = relatorioService.calcularTotalColhidoArea(idArea);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou rendimento total de colheita da área ID: " + idArea);

        return ResponseEntity.ok(total);
    }
}