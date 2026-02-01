package br.com.cultiva.cultivamais.controller;

import java.util.List;

import br.com.cultiva.cultivamais.dto.AreaCultivoDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.service.AreaCultivoService;
import br.com.cultiva.cultivamais.service.GeolocalizacaoService;
import br.com.cultiva.cultivamais.service.GeolocalizacaoService.DadosSolares;
import br.com.cultiva.cultivamais.service.LogService;
import br.com.cultiva.cultivamais.security.SecurityUtils;

@RestController
@RequestMapping("/api/areas")
public class AreaCultivoController {
    private final AreaCultivoService areaCultivoService;
    private final GeolocalizacaoService geolocalizacaoService;
    private final LogService logService;
    private final SecurityUtils securityUtils;

    public AreaCultivoController(AreaCultivoService areaCultivoService, GeolocalizacaoService geolocalizacaoService, LogService logService, SecurityUtils securityUtils) {
        this.areaCultivoService = areaCultivoService;
        this.geolocalizacaoService = geolocalizacaoService;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    // MÉTODO AUXILIAR
    private AreaCultivoDTO converterParaDTO(AreaCultivo area) {
        return new AreaCultivoDTO(
                area.getIdArea(),
                area.getNomeArea(),
                area.getLocalizacaoArea(),
                area.getLatitudeArea(),
                area.getLongitudeArea(),
                area.getTamanhoArea(),
                area.getTipoSolo(),
                area.getQuantidadeLuz(),
                area.getObservacaoArea()
        );
    }

    // CRIAR ÁREA
    @PostMapping
    public ResponseEntity<AreaCultivoDTO> criarAreaCultivo(@Valid @RequestBody AreaCultivoDTO areaDTO) {
        AreaCultivo novaArea = new AreaCultivo();
        novaArea.setNomeArea(areaDTO.getNomeArea());
        novaArea.setLocalizacaoArea(areaDTO.getLocalizacaoArea());
        novaArea.setLatitudeArea(areaDTO.getLatitudeArea());
        novaArea.setLongitudeArea(areaDTO.getLongitudeArea());
        novaArea.setTamanhoArea(areaDTO.getTamanhoArea());
        novaArea.setTipoSolo(areaDTO.getTipoSolo());
        novaArea.setQuantidadeLuz(areaDTO.getQuantidadeLuz());
        novaArea.setObservacaoArea(areaDTO.getObservacaoArea());

        AreaCultivo areaSalva = areaCultivoService.criarAreaCultivo(novaArea);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Cadastrou nova área de cultivo: " + areaSalva.getNomeArea());

        return ResponseEntity.ok(converterParaDTO(areaSalva));
    }

    // LISTAR ÁREAS
    @GetMapping
    public ResponseEntity<List<AreaCultivoDTO>> listarAreas() {
        List<AreaCultivoDTO> listaDTO = areaCultivoService.listarTodas()
                .stream()
                .map(this::converterParaDTO)
                .toList();
        return ResponseEntity.ok(listaDTO);
    }

    // OBTER DADOS CLIMÁTICOS
    @GetMapping("/{id}/clima")
    public ResponseEntity<DadosSolares> obterDadosClimaticos(@PathVariable Long id) {
        DadosSolares dados = geolocalizacaoService.buscarDadosExternos(id);
        if (dados != null) return ResponseEntity.ok(dados);
        return ResponseEntity.notFound().build();
    }

    // EXCLUIR ÁREA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirArea(@PathVariable Long id) {
        // Busca a área para registrar o nome no log antes de deletar
        AreaCultivo area = areaCultivoService.buscarPorId(id);
        String nomeArea = area.getNomeArea();

        areaCultivoService.excluirArea(id);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Removeu a área de cultivo: " + nomeArea);

        return ResponseEntity.noContent().build();
    }

    // EDITAR ÁREA
    @PutMapping("/{id}")
    public ResponseEntity<AreaCultivoDTO> atualizarArea(@PathVariable Long id, @RequestBody AreaCultivo area) {
        AreaCultivo areaAtualizada = areaCultivoService.atualizarArea(id, area);

        logService.registrarLog(securityUtils.getNomeUsuarioLogado(),
                "Atualizou a área de cultivo: " + areaAtualizada.getNomeArea());

        return ResponseEntity.ok(converterParaDTO(areaAtualizada));
    }
}