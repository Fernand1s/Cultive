package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.*;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    private final CultivoRepository cultivoRepository;
    private final PlantaRepository plantaRepository;
    private final AreaCultivoRepository areaCultivoRepository;

    public RelatorioService(CultivoRepository cultivoRepository,
                            PlantaRepository plantaRepository,
                            AreaCultivoRepository areaCultivoRepository) {
        this.cultivoRepository = cultivoRepository;
        this.plantaRepository = plantaRepository;
        this.areaCultivoRepository = areaCultivoRepository;
    }

    // LÓGICA DE COMPATIBILIDADE (SOLO E LUZ)
    @Transactional(readOnly = true)
    public CompatibilidadeDTO verificarCompatibilidadeTotal(Long idPlanta, Long idArea) {
        Planta planta = plantaRepository.findById(idPlanta)
                .orElseThrow(() -> new ResourceNotFoundException("Planta não encontrada"));
        AreaCultivo area = areaCultivoRepository.findById(idArea)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada"));

        boolean soloOk = planta.getSolosRecomendados().contains(area.getTipoSolo());
        boolean luzOk = (planta.getLuzRecomendada() == area.getQuantidadeLuz());

        String mensagem = "Ambiente ideal para esta espécie.";
        if (!soloOk || !luzOk) {
            mensagem = (!soloOk ? "Solo incompatível. " : "") + (!luzOk ? "Luz inadequada." : "");
        }

        return new CompatibilidadeDTO(soloOk && luzOk, mensagem);
    }

    // CÁLCULO DE CONSUMO DE ÁGUA ACUMULADO
    @Transactional(readOnly = true)
    public ConsumoAguaDTO calcularTotalAguaCultivo(Long idCultivo) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado"));

        double totalVolume = cultivo.getEventosRegistrados().stream()
                .filter(e -> e instanceof Irrigacao)
                .mapToDouble(e -> ((Irrigacao) e).getVolumeAgua())
                .sum();

        return new ConsumoAguaDTO(idCultivo, cultivo.getPlanta().getNomePopular(), totalVolume);
    }

    // HISTÓRICO FITOSSANITÁRIO DETALHADO
    @Transactional(readOnly = true)
    public List<HistoricoPragaDTO> obterHistoricoPragasDTO(Long idCultivo) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado"));

        return cultivo.getEventosRegistrados().stream()
                .filter(e -> e instanceof DoencaPraga)
                .map(e -> {
                    DoencaPraga dp = (DoencaPraga) e;
                    return new HistoricoPragaDTO(
                            dp.getNomePragaOuDoenca(),
                            dp.getNivelAfetacao().toString(),
                            dp.getDataHora(),
                            dp.getObservacaoEvento()
                    );
                })
                .collect(Collectors.toList());
    }

    // TOTAL DE PRODUÇÃO POR ÁREA
    @Transactional(readOnly = true)
    public double calcularTotalColhidoArea(Long idArea) {
        return cultivoRepository.sumQuantidadeColhidaByArea(idArea);
    }
}