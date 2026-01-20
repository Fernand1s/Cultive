package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.LogResponseDTO;
import br.com.cultiva.cultivamais.model.LogSistema;
import br.com.cultiva.cultivamais.repository.LogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LogService {

    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarLog(String usuario, String acao) {
        try {
            LogSistema log = new LogSistema(usuario, acao);
            logRepository.save(log);
        } catch (Exception e) {
            System.err.println("Falha ao salvar log: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<LogResponseDTO> listarTodosDTO() {
        return logRepository.findAllByOrderByDataHoraDesc()
                .stream()
                .map(log -> new LogResponseDTO(
                        log.getId(),
                        log.getUsuario(),
                        log.getAcao(),
                        log.getDataHora()
                ))
                .collect(Collectors.toList());
    }
}