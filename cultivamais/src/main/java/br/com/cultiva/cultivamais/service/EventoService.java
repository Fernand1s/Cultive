package br.com.cultiva.cultivamais.service;

import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import io.micrometer.common.lang.NonNull;

@Service
public class EventoService {

    private final CultivoRepository cultivoRepository;
    private final IrrigacaoRepository irrigacaoRepository;
    private final DoencaPragaRepository doencaPragaRepository;
    private final LogRepository logRepository;
    private final NotificacaoService notificacaoService;

    public EventoService(CultivoRepository cultivoRepository, IrrigacaoRepository irrigacaoRepository, DoencaPragaRepository doencaPragaRepository, LogRepository logRepository, NotificacaoService notificacaoService) {
        this.cultivoRepository = cultivoRepository;
        this.irrigacaoRepository = irrigacaoRepository;
        this.doencaPragaRepository = doencaPragaRepository;
        this.logRepository = logRepository;
        this.notificacaoService = notificacaoService;
    }

    public Irrigacao registrarIrrigacao(@NonNull Long idUsuario, @NonNull Long idCultivo, double volumeAgua, MetodoIrrigacao metodo, String observacao, LocalDateTime dataHora) {

        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        Irrigacao novaIrrigacao = new Irrigacao(cultivo, dataHora, observacao, volumeAgua, metodo);
        Irrigacao salvo = irrigacaoRepository.save(novaIrrigacao);

        logRepository.save(new LogSistema("Usuario ID " + idUsuario, "Irrigação registrada: " + volumeAgua + "L"));

        notificacaoService.criarNotificacao(
                idUsuario,
                "Irrigação Realizada",
                "Registro de " + volumeAgua + "L aplicado via " + metodo,
                "info"
        );

        return salvo;
    }


    public DoencaPraga registrarDoencaPraga(@NonNull Long idUsuario, @NonNull Long idCultivo, String nomePraga, NivelAfetacao nivel, String observacao, LocalDateTime dataHora) {

        Cultivo cultivo = cultivoRepository.findById(idCultivo).orElseThrow(
                () -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        DoencaPraga novaDoenca = new DoencaPraga(cultivo, dataHora, observacao, nomePraga, nivel);
        DoencaPraga salvo = doencaPragaRepository.save(novaDoenca);

        logRepository.save(new LogSistema("Usuario ID " + idUsuario, "Praga registrada: " + nomePraga));

        String tipoNotificacao = "alerta";
        if (nivel == NivelAfetacao.ALTO || nivel == NivelAfetacao.CRITICO) {
            tipoNotificacao = "erro";
        }

        notificacaoService.criarNotificacao(
                idUsuario,
                "Alerta Fitossanitário: " + nomePraga,
                "Identificado nível " + nivel + " no cultivo de " + cultivo.getPlantaCultivada().getNomePopular(),
                tipoNotificacao
        );

        return salvo;
    }
}