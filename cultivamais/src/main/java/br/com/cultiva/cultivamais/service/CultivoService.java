package br.com.cultiva.cultivamais.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private CultivoRepository cultivoRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private AreaCultivoRepository areaCultivoRepository;

    @Autowired
    private LogService logService;

    // CRIAR CULTIVO
    @Transactional
    public Cultivo criarCultivo(Long idPlanta, Long idArea, double quantidadePlantada, LocalDate dataPlantio) {
        Optional<Planta> plantaOpt = plantaRepository.findById(idPlanta);
        Optional<AreaCultivo> areaOpt = areaCultivoRepository.findById(idArea);

        if (plantaOpt.isPresent() && areaOpt.isPresent()) {
            Planta planta = plantaOpt.get();
            AreaCultivo area = areaOpt.get();

            Cultivo novoCultivo = new Cultivo(planta, area, dataPlantio, quantidadePlantada);
            Cultivo salvo = cultivoRepository.save(novoCultivo);

            logService.registrarLog("Sistema",
                    "Iniciou cultivo de " + planta.getNomePopular() + " na área " + area.getNomeArea());

            return salvo;
        } else {
            throw new RuntimeException("Planta ou Área de Cultivo não encontrados.");
        }
    }

    // LISTAR TODOS
    public List<Cultivo> listarTodos() {
        return cultivoRepository.findAll();
    }

    // ATUALIZAR
    @Transactional
    public Cultivo atualizarCultivo(Long id, Cultivo dadosNovos) {
        Optional<Cultivo> cultivoOpt = cultivoRepository.findById(id);

        if (cultivoOpt.isPresent()) {
            Cultivo cultivo = cultivoOpt.get();

            if(dadosNovos.getQuantidadePlantada() > 0) {
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

                if(dadosNovos.getEstadoPlanta() == EstadoPlanta.CRITICO) {
                    logService.registrarLog("Alerta", "O cultivo ID " + id + " entrou em estado CRÍTICO.");
                }
            }

            if (dadosNovos.getDataColheitaFinal() != null) {
                cultivo.setDataColheitaFinal(dadosNovos.getDataColheitaFinal());
                cultivo.setQuantidadeColhida(dadosNovos.getQuantidadeColhida());

                cultivo.setStatusCultivo(StatusCultivo.COLHIDO);

                logService.registrarLog("Sistema", "Cultivo ID " + id + " foi colhido com sucesso.");
            }

            return cultivoRepository.save(cultivo);
        }
        return null;
    }

    // EXCLUIR
    public void excluirCultivo(Long id) {
        if (cultivoRepository.existsById(id)) {
            cultivoRepository.deleteById(id);
            logService.registrarLog("Sistema", "Removeu cultivo ID: " + id);
        } else {
            throw new RuntimeException("Cultivo não encontrado para exclusão.");
        }
    }
}