package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.TarefaDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.Tarefa;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.TarefaRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LogService logService;
    private final NotificacaoService notificacaoService;

    public TarefaService(TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository,
                         LogService logService, NotificacaoService notificacaoService) {
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.logService = logService;
        this.notificacaoService = notificacaoService;
    }

    // CRIAR TAREFA
    @Transactional
    public TarefaDTO criarTarefa(Long idCriador, Long idResponsavel, TarefaDTO dto) {
        Usuario criador = usuarioRepository.findById(idCriador)
                .orElseThrow(() -> new ResourceNotFoundException("Criador não encontrado"));

        Long respId = (idResponsavel != null) ? idResponsavel : idCriador;
        Usuario responsavel = usuarioRepository.findById(respId)
                .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado"));

        Tarefa tarefa = new Tarefa();
        tarefa.setTitulo(dto.getTitulo());
        tarefa.setDescricao(dto.getDescricao());
        tarefa.setPrioridade(dto.getPrioridade());
        tarefa.setCategoria(dto.getCategoria());
        tarefa.setDataPrazo(dto.getDataPrazo());
        tarefa.setCriador(criador);
        tarefa.setResponsavel(responsavel);
        tarefa.setDataCriacao(LocalDateTime.now());
        tarefa.setConcluida(false);
        tarefa.setCancelada(false);

        Tarefa salva = tarefaRepository.save(tarefa);

        logService.registrarLog(criador.getNomeUsuario(),
                "Criou tarefa: " + salva.getTitulo() + " para " + responsavel.getNomeUsuario());

        if (!idCriador.equals(respId)) {
            notificacaoService.criarNotificacao(respId, "Nova Tarefa Designada",
                    "Você recebeu a tarefa: " + salva.getTitulo(), "info");
        }
        return converterParaDTO(salva);
    }

    // LISTAR TODAS
    public List<TarefaDTO> listarTodas() {
        return tarefaRepository.findAll().stream().map(this::converterParaDTO).toList();
    }

    // LISTAR POR USUÁRIO E FUNÇÃO
    public List<TarefaDTO> listarTarefasPorUsuario(Long idUsuario, String funcao) {
        List<Tarefa> tarefas;
        if (funcao != null && (funcao.equalsIgnoreCase("ADMIN") || funcao.equalsIgnoreCase("ADMINISTRADOR"))) {
            tarefas = tarefaRepository.findAll();
        } else {
            tarefas = tarefaRepository.findByResponsavel_IdUsuarioOrCriador_IdUsuario(idUsuario, idUsuario);
        }
        return tarefas.stream().map(this::converterParaDTO).toList();
    }

    // ATUALIZAR TAREFA
    @Transactional
    public TarefaDTO atualizarTarefa(Long id, TarefaDTO dto, Long idUsuarioLogado) {
        Tarefa tarefa = tarefaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario logado = usuarioRepository.findById(idUsuarioLogado).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarPermissaoGestao(tarefa, logado);

        tarefa.setTitulo(dto.getTitulo());
        tarefa.setDescricao(dto.getDescricao());
        tarefa.setPrioridade(dto.getPrioridade());
        tarefa.setCategoria(dto.getCategoria());
        tarefa.setDataPrazo(dto.getDataPrazo());

        logService.registrarLog(logado.getNomeUsuario(), "Editou dados da tarefa ID: " + id);
        return converterParaDTO(tarefaRepository.save(tarefa));
    }

    // CONCLUIR TAREFA
    @Transactional
    public TarefaDTO concluirTarefa(Long id, Long idUsuarioLogado, String observacao) {
        Tarefa t = tarefaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        t.setConcluida(!t.isConcluida());
        t.setDataConclusao(t.isConcluida() ? LocalDateTime.now() : null);
        t.setObservacaoConclusao(observacao);

        logService.registrarLog(u.getNomeUsuario(), (t.isConcluida() ? "Concluiu" : "Reabriu") + " tarefa: " + t.getTitulo());

        return converterParaDTO(tarefaRepository.save(t));
    }

    // CANCELAR TAREFA
    @Transactional
    public TarefaDTO cancelarTarefa(Long id, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarPermissaoGestao(t, u);
        t.setCancelada(true);
        t.setConcluida(false);

        logService.registrarLog(u.getNomeUsuario(), "Cancelou tarefa: " + t.getTitulo());
        return converterParaDTO(tarefaRepository.save(t));
    }

    // EXCLUIR TAREFA
    @Transactional
    public void excluirTarefa(Long id, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarPermissaoGestao(t, u);
        tarefaRepository.delete(t);
        logService.registrarLog(u.getNomeUsuario(), "Removeu permanentemente a tarefa: " + t.getTitulo());
    }

    // VALIDAÇÃO DE ACESSO
    private void validarPermissaoGestao(Tarefa t, Usuario u) {
        boolean isAdmin = u.getFuncao().toString().contains("ADMIN") || u.getFuncao().toString().contains("EMPRESA");
        boolean isCriador = t.getCriador().getIdUsuario().equals(u.getIdUsuario());
        if (!isAdmin && !isCriador) {
            throw new RuntimeException("Acesso negado: Somente o criador ou administradores podem gerenciar esta tarefa.");
        }
    }

    // AGENDAMENTO: VERIFICAR ATRASOS (ÀS 08:00)
    @Scheduled(cron = "0 0 8 * * *")
    public void verificarTarefasAtrasadas() {
        List<Tarefa> tarefas = tarefaRepository.findAll();
        LocalDate hoje = LocalDate.now();

        tarefas.stream()
                .filter(t -> !t.isConcluida() && !t.isCancelada())
                .filter(t -> t.getDataPrazo() != null && t.getDataPrazo().toLocalDate().isBefore(hoje))
                .forEach(t -> {
                    notificacaoService.criarNotificacao(t.getResponsavel().getIdUsuario(),
                            "Tarefa Atrasada!", "O prazo de '" + t.getTitulo() + "' expirou.", "erro");
                    logService.registrarLog("SISTEMA", "Notificou atraso da tarefa ID: " + t.getId());
                });
    }

    // CONVERTER PARA DTO
    private TarefaDTO converterParaDTO(Tarefa t) {
        TarefaDTO dto = new TarefaDTO();
        dto.setId(t.getId());
        dto.setTitulo(t.getTitulo());
        dto.setDescricao(t.getDescricao());
        dto.setPrioridade(t.getPrioridade());
        dto.setCategoria(t.getCategoria());
        dto.setDataPrazo(t.getDataPrazo());
        dto.setIdResponsavel(t.getResponsavel().getIdUsuario());
        dto.setStatus(t.getStatus());
        dto.setConcluida(t.isConcluida());
        return dto;
    }
}