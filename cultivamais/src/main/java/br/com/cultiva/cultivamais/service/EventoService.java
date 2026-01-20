package br.com.cultiva.cultivamais.service;

import java.time.LocalDateTime;
import java.util.List;

import br.com.cultiva.cultivamais.dto.DoencaPragaDTO;
import br.com.cultiva.cultivamais.dto.IrrigacaoDTO;
import org.springframework.stereotype.Service;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventoService {

    private final CultivoRepository cultivoRepository;
    private final IrrigacaoRepository irrigacaoRepository;
    private final DoencaPragaRepository doencaPragaRepository;
    private final NotificacaoService notificacaoService;

    public EventoService(CultivoRepository cultivoRepository,
                         IrrigacaoRepository irrigacaoRepository,
                         DoencaPragaRepository doencaPragaRepository,
                         NotificacaoService notificacaoService) {
        this.cultivoRepository = cultivoRepository;
        this.irrigacaoRepository = irrigacaoRepository;
        this.doencaPragaRepository = doencaPragaRepository;
        this.notificacaoService = notificacaoService;
    }

    // REGISTRAR IRRIGAÇÃO
    @Transactional
    public Irrigacao registrarIrrigacao(Long idCultivo, IrrigacaoDTO dto) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        LocalDateTime dataHora = (dto.getDataHora() == null) ? LocalDateTime.now() : dto.getDataHora();

        Irrigacao novaIrrigacao = new Irrigacao(cultivo, dataHora, dto.getObservacao(), dto.getVolumeAgua(), dto.getMetodo());
        Irrigacao salvo = irrigacaoRepository.save(novaIrrigacao);

        notificacaoService.criarNotificacao(
                dto.getIdUsuario(),
                "Irrigação Realizada",
                "Registro de " + dto.getVolumeAgua() + "L aplicado via " + dto.getMetodo(),
                "info"
        );

        return salvo;
    }

    // REGISTRAR DOENÇA/PRAGA
    @Transactional
    public DoencaPraga registrarDoencaPraga(Long idCultivo, DoencaPragaDTO dto) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        LocalDateTime dataHora = (dto.getDataHora() == null) ? LocalDateTime.now() : dto.getDataHora();

        DoencaPraga novaDoenca = new DoencaPraga(cultivo, dataHora, dto.getObservacao(), dto.getNomePraga(), dto.getNivel());
        DoencaPraga salvo = doencaPragaRepository.save(novaDoenca);

        String tipoNotificacao = (dto.getNivel() == NivelAfetacao.ALTO || dto.getNivel() == NivelAfetacao.CRITICO) ? "erro" : "alerta";

        notificacaoService.criarNotificacao(
                dto.getIdUsuario(),
                "Alerta Fitossanitário: " + dto.getNomePraga(),
                "Identificado nível " + dto.getNivel() + " no cultivo de " + cultivo.getPlantaCultivada().getNomePopular(),
                tipoNotificacao
        );

        return salvo;
    }

    // LISTAR IRRIGAÇÕES DE UM CULTIVO
    public List<Irrigacao> listarIrrigacoesPorCultivo(Long idCultivo) {
        return irrigacaoRepository.findByCultivo_IdCultivo(idCultivo);
    }

    // LISTAR PRAGAS DE UM CULTIVO
    public List<DoencaPraga> listarPragasPorCultivo(Long idCultivo) {
        return doencaPragaRepository.findByCultivo_IdCultivo(idCultivo);
    }

    // EXCLUIR IRRIGAÇÃO
    @Transactional
    public void excluirIrrigacao(Long idEvento) {
        if (!irrigacaoRepository.existsById(idEvento)) {
            throw new ResourceNotFoundException("Registro de irrigação não encontrado");
        }
        irrigacaoRepository.deleteById(idEvento);
    }

    // EXCLUIR PRAGA
    @Transactional
    public void excluirPraga(Long idEvento) {
        if (!doencaPragaRepository.existsById(idEvento)) {
            throw new ResourceNotFoundException("Registro de praga não encontrado");
        }
        doencaPragaRepository.deleteById(idEvento);
    }

    // ATUALIZAR IRRIGAÇÃO
    @Transactional
    public Irrigacao atualizarIrrigacao(Long idEvento, IrrigacaoDTO dto) {
        Irrigacao irrigacao = irrigacaoRepository.findById(idEvento)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de irrigação não encontrado"));

        irrigacao.setVolumeAgua(dto.getVolumeAgua());
        irrigacao.setMetodo(dto.getMetodo());
        irrigacao.setDataHora(dto.getDataHora());
        irrigacao.setObservacaoEvento(dto.getObservacao());

        return irrigacaoRepository.save(irrigacao);
    }

    // ATUALIZAR PRAGA
    @Transactional
    public DoencaPraga atualizarPraga(Long idEvento, DoencaPragaDTO dto) {
        DoencaPraga praga = doencaPragaRepository.findById(idEvento)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de praga não encontrado"));

        praga.setNomePragaOuDoenca(dto.getNomePraga());
        praga.setNivelAfetacao(dto.getNivel());
        praga.setDataHora(dto.getDataHora());
        praga.setObservacaoEvento(dto.getObservacao());

        return doencaPragaRepository.save(praga);
    }
}