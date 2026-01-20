package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.NotificacaoDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CultivoRepository cultivoRepository;
    private final TarefaRepository tarefaRepository;
    private final LogService logService;

    public NotificacaoService(NotificacaoRepository notificacaoRepository,
                              UsuarioRepository usuarioRepository,
                              CultivoRepository cultivoRepository,
                              TarefaRepository tarefaRepository,
                              LogService logService) {
        this.notificacaoRepository = notificacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.cultivoRepository = cultivoRepository;
        this.tarefaRepository = tarefaRepository;
        this.logService = logService;
    }

    // LISTAR POR USUÁRIOS (CONVERSÃO PARA DTO)
    public List<NotificacaoDTO> listarPorUsuario(Long idUsuario) {
        return notificacaoRepository.findByUsuario_IdUsuarioOrderByDataHoraDesc(idUsuario)
                .stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    // CONTAR NÃO LIDAS
    public Long contarNaoLidas(Long idUsuario) {
        return notificacaoRepository.countByUsuario_IdUsuarioAndLidaFalse(idUsuario);
    }

    // CRIAR NOTIFICAÇÃO (USO INTERNO)
    @Transactional
    public Notificacao criarNotificacao(Long idUsuario, String titulo, String mensagem, String tipo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + idUsuario));

        Notificacao notificacao = new Notificacao(titulo, mensagem, tipo, usuario);
        return notificacaoRepository.save(notificacao);
    }

    // MARCAR COMO LIDA
    @Transactional
    public void marcarComoLida(Long idNotificacao) {
        notificacaoRepository.findById(idNotificacao).ifPresent(n -> {
            n.setLida(true);
            notificacaoRepository.save(n);
        });
    }

    // MARCAR COMO NÃO LIDA
    @Transactional
    public void marcarComoNaoLida(Long idNotificacao) {
        notificacaoRepository.findById(idNotificacao).ifPresent(n -> {
            n.setLida(false);
            notificacaoRepository.save(n);
        });
    }

    // MARCAR TODAS COMO LIDAS
    @Transactional
    public void marcarTodasComoLidas(Long idUsuario) {
        List<Notificacao> notificacoes = notificacaoRepository.findByUsuario_IdUsuarioOrderByDataHoraDesc(idUsuario);
        notificacoes.forEach(n -> n.setLida(true));
        notificacaoRepository.saveAll(notificacoes);
    }

    // MARCAR TODAS COMO NÃO LIDAS
    @Transactional
    public void marcarTodasComoNaoLidas(Long idUsuario) {
        List<Notificacao> notificacoes = notificacaoRepository.findByUsuario_IdUsuarioOrderByDataHoraDesc(idUsuario);
        notificacoes.forEach(n -> n.setLida(false));
        notificacaoRepository.saveAll(notificacoes);
    }

    // EXCLUIR NOTIFICAÇÃO
    @Transactional
    public void excluir(Long id) {
        if (notificacaoRepository.existsById(id)) {
            notificacaoRepository.deleteById(id);
        } else {
            throw new ResourceNotFoundException("Notificação não encontrada.");
        }
    }

    // --- AGENDAMENTOS (LOGICA AUTOMÁTICA) ---

    // VERIFICAR NECESSIDADE DE IRRIGAÇÃO (CADA 6 HORAS)
    @Scheduled(fixedRate = 21600000)
    @Transactional
    public void verificarNecessidadeIrrigacao() {
        List<Cultivo> todosCultivos = cultivoRepository.findAll();
        LocalDateTime limite = LocalDateTime.now().minusHours(24);

        for (Cultivo cultivo : todosCultivos) {
            boolean irrigadoRecentemente = cultivo.getEventosRegistrados().stream()
                    .anyMatch(e -> e.getDataHora().isAfter(limite) && e instanceof Irrigacao);

            if (!irrigadoRecentemente && !cultivo.getAreaCultivo().getUsuariosResponsaveis().isEmpty()) {
                Usuario responsavel = cultivo.getAreaCultivo().getUsuariosResponsaveis().get(0);
                criarNotificacao(responsavel.getIdUsuario(), "Planta com sede!",
                        "O cultivo de " + cultivo.getPlanta().getNomePopular() + " não é irrigado há mais de 24h.", "ALERTA");

                logService.registrarLog("SISTEMA", "Gerou alerta de irrigação para cultivo ID: " + cultivo.getIdCultivo());
            }
        }
    }

    // NOTIFICAR TAREFAS DO DIA (ÀS 07:00)
    @Scheduled(cron = "0 0 7 * * ?")
    @Transactional
    public void notificarTarefasDoDia() {
        List<Tarefa> tarefasPendentes = tarefaRepository.findAll();
        int count = 0;
        for (Tarefa tarefa : tarefasPendentes) {
            if (tarefa.getStatus() != StatusTarefa.CONCLUIDA) {
                criarNotificacao(tarefa.getResponsavel().getIdUsuario(), "Tarefa para hoje",
                        "Você tem a tarefa: " + tarefa.getTitulo() + " pendente.", "TAREFA");
                count++;
            }
        }
        if(count > 0) logService.registrarLog("SISTEMA", "Disparou " + count + " notificações de tarefas pendentes.");
    }

    // CONVERTER ENTIDADE PARA DTO
    private NotificacaoDTO converterParaDTO(Notificacao n) {
        return new NotificacaoDTO(
                n.getId(),
                n.getUsuario().getIdUsuario(),
                n.getTitulo(),
                n.getMensagem(),
                n.getTipo(),
                n.getDataHora(),
                n.isLida()
        );
    }

    // SALVAR E RETORNAR DTO
    @Transactional
    public NotificacaoDTO salvarERetornarDTO(NotificacaoDTO dto) {
        Notificacao n = criarNotificacao(
                dto.getIdUsuario(),
                dto.getTitulo(),
                dto.getMensagem(),
                dto.getTipo()
        );
        return converterParaDTO(n);
    }
}