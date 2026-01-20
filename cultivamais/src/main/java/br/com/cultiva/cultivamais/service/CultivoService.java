package br.com.cultiva.cultivamais.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import br.com.cultiva.cultivamais.dto.CultivoRequestDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.model.Cultivo;
import br.com.cultiva.cultivamais.model.EstadoPlanta;
import br.com.cultiva.cultivamais.model.Planta;
import br.com.cultiva.cultivamais.model.StatusCultivo;
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import br.com.cultiva.cultivamais.repository.CultivoRepository;
import br.com.cultiva.cultivamais.repository.PlantaRepository;

@Service
public class CultivoService {

    private final CultivoRepository cultivoRepository;
    private final PlantaRepository plantaRepository;
    private final AreaCultivoRepository areaCultivoRepository;

    public CultivoService(CultivoRepository cultivoRepository,
                          PlantaRepository plantaRepository,
                          AreaCultivoRepository areaCultivoRepository) {
        this.cultivoRepository = cultivoRepository;
        this.plantaRepository = plantaRepository;
        this.areaCultivoRepository = areaCultivoRepository;
    }

    // CRIAR CULTIVO
    @Transactional
    public Cultivo criarCultivo(Long idPlanta, Long idArea, double quantidadePlantada, LocalDate dataPlantio) {
        Optional<Planta> plantaOpt = plantaRepository.findById(idPlanta);
        Optional<AreaCultivo> areaOpt = areaCultivoRepository.findById(idArea);

        if (plantaOpt.isPresent() && areaOpt.isPresent()) {
            Planta planta = plantaOpt.get();
            AreaCultivo area = areaOpt.get();

            Cultivo novoCultivo = new Cultivo(planta, area, dataPlantio, quantidadePlantada);
            return cultivoRepository.save(novoCultivo);
        } else {
            throw new ResourceNotFoundException("Planta ou Área de Cultivo não encontrados.");
        }
    }

    // LISTAR TODOS
    public List<Cultivo> listarTodos() {
        return cultivoRepository.findAll();
    }

    // BUSCAR POR ID
    public Cultivo buscarPorId(Long id) {
        return cultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado com ID: " + id));
    }

    // ATUALIZAR
    @Transactional
    public Cultivo atualizarCultivo(Long id, CultivoRequestDTO dadosNovos) {
        Cultivo cultivo = cultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado com ID: " + id));

        if (dadosNovos.getQuantidadePlantada() > 0) {
            cultivo.setQuantidadePlantada(dadosNovos.getQuantidadePlantada());
        }

        if (dadosNovos.getObservacaoCultivo() != null) {
            cultivo.setObservacaoCultivo(dadosNovos.getObservacaoCultivo());
        }

        if (dadosNovos.getStatusCultivo() != null) {
            cultivo.setStatusCultivo(dadosNovos.getStatusCultivo());
        }

        if (dadosNovos.getEstadoPlanta() != null) {
            cultivo.setEstadoPlanta(dadosNovos.getEstadoPlanta());
        }

        if (dadosNovos.getDataColheitaFinal() != null) {
            cultivo.setDataColheitaFinal(dadosNovos.getDataColheitaFinal());

            if (dadosNovos.getQuantidadeColhida() != null) {
                cultivo.setQuantidadeColhida(dadosNovos.getQuantidadeColhida());
            }

            cultivo.setStatusCultivo(StatusCultivo.COLHIDO);
        }

        return cultivoRepository.save(cultivo);
    }

    // EXCLUIR
    public void excluirCultivo(Long id) {
        if (cultivoRepository.existsById(id)) {
            cultivoRepository.deleteById(id);
        } else {
            throw new ResourceNotFoundException("Cultivo não encontrado para exclusão.");
        }
    }
}