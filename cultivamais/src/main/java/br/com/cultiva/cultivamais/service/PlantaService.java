package br.com.cultiva.cultivamais.service;

import java.util.List;

import br.com.cultiva.cultivamais.dto.PlantaDTO;
import org.springframework.stereotype.Service;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.Planta;
import br.com.cultiva.cultivamais.repository.PlantaRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlantaService {

    private final PlantaRepository plantaRepository;
    private final NotificacaoService notificacaoService;

    public PlantaService(PlantaRepository plantaRepository, NotificacaoService notificacaoService) {
        this.plantaRepository = plantaRepository;
        this.notificacaoService = notificacaoService;
    }

    // CRIAR PLANTA
    @Transactional
    public PlantaDTO criarPlanta(Long idUsuario, PlantaDTO dto) {
        Planta planta = new Planta();
        copiarDadosDtoParaEntity(dto, planta);

        Planta salva = plantaRepository.save(planta);

        notificacaoService.criarNotificacao(idUsuario, "Nova Espécie",
                salva.getNomePopular() + " foi adicionada ao catálogo.", "info");

        return converterParaDTO(salva);
    }

    // ATUALIZAR PLANTA
    @Transactional
    public PlantaDTO atualizarPlanta(Long id, PlantaDTO dto) {
        Planta plantaExistente = plantaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planta não encontrada."));

        copiarDadosDtoParaEntity(dto, plantaExistente);
        Planta salva = plantaRepository.save(plantaExistente);

        return converterParaDTO(salva);
    }

    // LISTAR TODAS AS PLANTAS
    @Transactional(readOnly = true)
    public List<PlantaDTO> listarTodas() {
        return plantaRepository.findAll()
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }

    // EXCLUIR PLANTA
    @Transactional
    public void excluirPlanta(Long id) {
        if (!plantaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Planta não encontrada.");
        }
        plantaRepository.deleteById(id);
    }

    // MÉTODO AUXILIAR PARA O LOG DO CONTROLLER
    public String buscarNomePlanta(Long id) {
        return plantaRepository.findById(id)
                .map(Planta::getNomePopular)
                .orElse("Planta Desconhecida");
    }

    // CONVERTER DTO PARA ENTITY (MAPEAMENTO MANUAL)
    private void copiarDadosDtoParaEntity(PlantaDTO dto, Planta entity) {
        entity.setNomePopular(dto.getNomePopular());
        entity.setNomeCientifico(dto.getNomeCientifico());
        entity.setTipoPlanta(dto.getTipoPlanta());
        entity.setCicloMedioDias(dto.getCicloMedioDias());
        entity.setDescricaoPlanta(dto.getDescricaoPlanta());
        entity.setFotoPlanta(dto.getFotoPlanta());
        entity.setLuzRecomendada(dto.getLuzRecomendada());
        entity.setAguaRecomendada(dto.getAguaRecomendada());
        entity.setSolosRecomendados(dto.getSolosRecomendados());
    }

    // CONVERTER ENTITY PARA DTO
    private PlantaDTO converterParaDTO(Planta p) {
        PlantaDTO dto = new PlantaDTO(
                p.getIdPlanta(),
                p.getNomePopular(),
                p.getNomeCientifico(),
                p.getTipoPlanta(),
                p.getCicloMedioDias(),
                p.getDescricaoPlanta(),
                p.getLuzRecomendada(),
                p.getAguaRecomendada(),
                p.getSolosRecomendados()
        );
        dto.setFotoPlanta(p.getFotoPlanta());
        return dto;
    }
}