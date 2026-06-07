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

    // ===================== EXISTENTES =====================

    @GetMapping("/agua/{idCultivo}")
    public ResponseEntity<ConsumoAguaDTO> getRelatorioAgua(@PathVariable Long idCultivo) {
        ConsumoAguaDTO relatorio = relatorioService.calcularTotalAguaCultivo(idCultivo);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou relatório de consumo de água para o cultivo: " + relatorio.getPlanta());
        return ResponseEntity.ok(relatorio);
    }

    @GetMapping("/compatibilidade/{idPlanta}/{idArea}")
    public ResponseEntity<CompatibilidadeDTO> getCompatibilidade(@PathVariable Long idPlanta, @PathVariable Long idArea) {
        return ResponseEntity.ok(relatorioService.verificarCompatibilidadeTotal(idPlanta, idArea));
    }

    @GetMapping("/pragas/{idCultivo}")
    public ResponseEntity<List<HistoricoPragaDTO>> getHistoricoPragas(@PathVariable Long idCultivo) {
        List<HistoricoPragaDTO> historico = relatorioService.obterHistoricoPragasDTO(idCultivo);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou histórico fitossanitário (pragas) do cultivo ID: " + idCultivo);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/colheita/{idArea}")
    public ResponseEntity<Double> getTotalColhido(@PathVariable Long idArea) {
        Double total = relatorioService.calcularTotalColhidoArea(idArea);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou rendimento total de colheita da área ID: " + idArea);
        return ResponseEntity.ok(total);
    }

    // ===================== PRODUÇÃO E SAFRA =====================

    @GetMapping("/produtividade")
    public ResponseEntity<List<ProdutividadeDTO>> getProdutividade(
            @RequestParam(required = false) Long idArea) {
        List<ProdutividadeDTO> dados = relatorioService.calcularProdutividade(idArea);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou relatório de produtividade" + (idArea != null ? " para área ID: " + idArea : " - todas as áreas"));
        return ResponseEntity.ok(dados);
    }

    @GetMapping("/caderno-campo/{idCultivo}")
    public ResponseEntity<CadernoCampoDTO> getCadernoCampo(@PathVariable Long idCultivo) {
        CadernoCampoDTO caderno = relatorioService.gerarCadernoCampo(idCultivo);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou Caderno de Campo (rastreabilidade completa) do cultivo ID: " + idCultivo);
        return ResponseEntity.ok(caderno);
    }

    // ===================== FITOSSANITÁRIO =====================

    @GetMapping("/incidencia-pragas")
    public ResponseEntity<List<IncidenciaPragaDTO>> getIncidenciaPragas(
            @RequestParam(required = false) Long idArea,
            @RequestParam(required = false) Long idPlanta) {
        List<IncidenciaPragaDTO> dados = relatorioService.mapearIncidenciaPragas(idArea, idPlanta);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou mapa de incidência de pragas e doenças");
        return ResponseEntity.ok(dados);
    }

    // ===================== ESTOQUE E CONSUMO =====================

    @GetMapping("/alertas-estoque")
    public ResponseEntity<List<AlertaEstoqueDTO>> getAlertasEstoque() {
        List<AlertaEstoqueDTO> alertas = relatorioService.gerarAlertasEstoque();
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou alertas de estoque crítico - " + alertas.size() + " item(ns) em atenção");
        return ResponseEntity.ok(alertas);
    }

    // ===================== OCUPAÇÃO E SOLO =====================

    @GetMapping("/rotacao-culturas")
    public ResponseEntity<List<RotacaoCulturaDTO>> getRotacaoCulturas(
            @RequestParam(required = false) Long idArea) {
        List<RotacaoCulturaDTO> dados = relatorioService.calcularRotacaoCulturas(idArea);
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Consultou histórico de rotação de culturas");
        return ResponseEntity.ok(dados);
    }

    @GetMapping("/ocupacao-areas")
    public ResponseEntity<List<OcupacaoAreaDTO>> getOcupacaoAreas() {
        List<OcupacaoAreaDTO> dados = relatorioService.calcularOcupacaoAreas();
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou relatório de ocupação e ociosidade das áreas");
        return ResponseEntity.ok(dados);
    }

    // ===================== EQUIPE E OPERAÇÕES =====================

    @GetMapping("/desempenho-equipe")
    public ResponseEntity<List<DesempenhoEquipeDTO>> getDesempenhoEquipe() {
        List<DesempenhoEquipeDTO> dados = relatorioService.calcularDesempenhoEquipe();
        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Gerou relatório de desempenho operacional da equipe");
        return ResponseEntity.ok(dados);
    }
}
