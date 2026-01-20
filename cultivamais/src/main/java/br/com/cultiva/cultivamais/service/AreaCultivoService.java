package br.com.cultiva.cultivamais.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.model.LogSistema; // Import Log
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import br.com.cultiva.cultivamais.repository.LogRepository; // Import Repo
import io.micrometer.common.lang.NonNull;

@Service
public class AreaCultivoService {

    private final AreaCultivoRepository areaCultivoRepository;


    public AreaCultivoService(AreaCultivoRepository areaCultivoRepository) {
        this.areaCultivoRepository = areaCultivoRepository;
    }

    public AreaCultivo criarAreaCultivo(@NonNull AreaCultivo novaArea) {
        return areaCultivoRepository.save(novaArea);
    }

    public List<AreaCultivo> listarTodas() {
        return areaCultivoRepository.findAll();
    }

    public AreaCultivo buscarPorId(@NonNull Long id) {
        return areaCultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o ID: " + id));
    }

    public void excluirArea(@NonNull Long id) {
        if (!areaCultivoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Área não encontrada para exclusão.");
        }
        areaCultivoRepository.deleteById(id);
    }

    public AreaCultivo atualizarArea(@NonNull Long id, @NonNull AreaCultivo dadosAtualizados) {
        return areaCultivoRepository.findById(id)
                .map(areaExistente -> {
                    areaExistente.setNomeArea(dadosAtualizados.getNomeArea());
                    areaExistente.setLocalizacaoArea(dadosAtualizados.getLocalizacaoArea());
                    areaExistente.setTamanhoArea(dadosAtualizados.getTamanhoArea());
                    areaExistente.setTipoSolo(dadosAtualizados.getTipoSolo());

                    if (dadosAtualizados.getLatitudeArea() != null)
                        areaExistente.setLatitudeArea(dadosAtualizados.getLatitudeArea());

                    if (dadosAtualizados.getLongitudeArea() != null)
                        areaExistente.setLongitudeArea(dadosAtualizados.getLongitudeArea());

                    return areaCultivoRepository.save(areaExistente);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada para edição."));
    }
}