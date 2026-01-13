package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.model.Notificacao;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.model.Cultivo;
import br.com.cultiva.cultivamais.model.Tarefa;
import br.com.cultiva.cultivamais.repository.NotificacaoRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import br.com.cultiva.cultivamais.repository.CultivoRepository;
import br.com.cultiva.cultivamais.repository.TarefaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CultivoRepository cultivoRepository;
    private final TarefaRepository tarefaRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository, UsuarioRepository usuarioRepository, CultivoRepository cultivoRepository, TarefaRepository tarefaRepository) {
        this.notificacaoRepository = notificacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.cultivoRepository = cultivoRepository;
        this.tarefaRepository = tarefaRepository;
    }


    // LISTAR POR USUÁRIOS
    public List<Notificacao> listarPorUsuario(Long idUsuario) {
        return notificacaoRepository.findByUsuario_IdUsuarioOrderByDataHoraDesc(idUsuario);
    }

    // CRIAR NOTIFICAÇÃO
    @Transactional
    public Notificacao criarNotificacao(Long idUsuario, String titulo, String mensagem, String tipo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com ID: " + idUsuario));

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

    // MARCAR TODAS COMO LIDA
    @Transactional
    public void marcarTodasComoLidas(Long idUsuario) {
        List<Notificacao> notificacoes = notificacaoRepository.findByUsuario_IdUsuarioOrderByDataHoraDesc(idUsuario);
        notificacoes.forEach(n -> n.setLida(true));
        notificacaoRepository.saveAll(notificacoes);
    }

    // EXCLUIR NOTIFICAÇÃO
    @Transactional
    public void excluir(Long id) {
        if (notificacaoRepository.existsById(id)) {
            notificacaoRepository.deleteById(id);
        } else {
            throw new RuntimeException("Notificação não encontrada.");
        }
    }

    // VERIFICAR REGA
    @Scheduled(fixedRate = 21600000)
    @Transactional
    public void verificarNecessidadeIrrigacao() {
        List<Cultivo> todosCultivos = cultivoRepository.findAll();
        LocalDateTime limite = LocalDateTime.now().minusHours(24);

        for (Cultivo cultivo : todosCultivos) {
            boolean irrigadoRecentemente = cultivo.getEventosRegistrados().stream()
                    .anyMatch(e -> e.getDataHora().isAfter(limite) && e instanceof br.com.cultiva.cultivamais.model.Irrigacao);

            if (!irrigadoRecentemente && !cultivo.getAreaCultivo().getUsuariosResponsaveis().isEmpty()) {
                // Notifica o primeiro responsável da área
                Usuario responsavel = cultivo.getAreaCultivo().getUsuariosResponsaveis().get(0);
                criarNotificacao(
                        responsavel.getIdUsuario(),
                        "Planta com sede!",
                        "O cultivo de " + cultivo.getPlanta().getNomeComum() + " não é irrigado há mais de 24h.",
                        "ALERTA"
                );
            }
        }
    }

    // NOTIFICAÇÃO DE TAREFA DO DIA
    @Scheduled(cron = "0 0 7 * * ?")
    @Transactional
    public void notificarTarefasDoDia() {
        List<Tarefa> tarefasPendentes = tarefaRepository.findAll(); // Ideal seria filtrar por data no Repository
        for (Tarefa tarefa : tarefasPendentes) {
            if (tarefa.getStatus() != br.com.cultiva.cultivamais.model.StatusTarefa.CONCLUIDA) {
                criarNotificacao(
                        tarefa.getResponsavel().getIdUsuario(),
                        "Tarefa para hoje",
                        "Você tem a tarefa: " + tarefa.getTitulo() + " pendente.",
                        "TAREFA"
                );
            }
        }
    }
}