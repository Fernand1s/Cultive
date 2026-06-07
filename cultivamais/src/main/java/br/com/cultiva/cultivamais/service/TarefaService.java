package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.ConclusaoTarefaDTO;
import br.com.cultiva.cultivamais.dto.TarefaDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.model.Cultivo;
import br.com.cultiva.cultivamais.model.Tarefa;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import br.com.cultiva.cultivamais.repository.CultivoRepository;
import br.com.cultiva.cultivamais.repository.TarefaRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class TarefaService {

    private static final Set<String> SUBCATEGORIAS_OBSERVACAO = Set.of(
            "Monitoramento (Praguejamento)",
            "Controle Químico",
            "Controle Biológico",
            "Controle Cultural/Físico"
    );

    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AreaCultivoRepository areaCultivoRepository;
    private final CultivoRepository cultivoRepository;
    private final EstoqueService estoqueService;
    private final LogService logService;
    private final NotificacaoService notificacaoService;
    private final ObjectMapper objectMapper;

    public TarefaService(TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository,
                         AreaCultivoRepository areaCultivoRepository, CultivoRepository cultivoRepository,
                         EstoqueService estoqueService, LogService logService,
                         NotificacaoService notificacaoService, ObjectMapper objectMapper) {
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.areaCultivoRepository = areaCultivoRepository;
        this.cultivoRepository = cultivoRepository;
        this.estoqueService = estoqueService;
        this.logService = logService;
        this.notificacaoService = notificacaoService;
        this.objectMapper = objectMapper;
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
        tarefa.setSubcategoria(dto.getSubcategoria());
        tarefa.setInformacoesExtras(dto.getInformacoesExtras());
        tarefa.setDataPrazo(dto.getDataPrazo());
        tarefa.setCriador(criador);
        tarefa.setResponsavel(responsavel);
        tarefa.setDataCriacao(LocalDateTime.now());
        tarefa.setConcluida(false);
        tarefa.setCancelada(false);
        tarefa.setEmObservacao(false);

        if (dto.getIdArea() != null) {
            areaCultivoRepository.findById(dto.getIdArea()).ifPresent(tarefa::setAreaCultivo);
        }
        if (dto.getIdCultivo() != null) {
            cultivoRepository.findById(dto.getIdCultivo()).ifPresent(tarefa::setCultivo);
        }

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
        Tarefa tarefa = tarefaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario logado = usuarioRepository.findById(idUsuarioLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarPermissaoGestao(tarefa, logado);

        tarefa.setTitulo(dto.getTitulo());
        tarefa.setDescricao(dto.getDescricao());
        tarefa.setPrioridade(dto.getPrioridade());
        tarefa.setCategoria(dto.getCategoria());
        tarefa.setSubcategoria(dto.getSubcategoria());
        tarefa.setInformacoesExtras(dto.getInformacoesExtras());
        tarefa.setDataPrazo(dto.getDataPrazo());

        if (dto.getIdResponsavel() != null) {
            Usuario novoResponsavel = usuarioRepository.findById(dto.getIdResponsavel())
                    .orElseThrow(() -> new ResourceNotFoundException("Responsável não encontrado"));
            tarefa.setResponsavel(novoResponsavel);
        }

        if (dto.getIdArea() != null) {
            areaCultivoRepository.findById(dto.getIdArea()).ifPresent(tarefa::setAreaCultivo);
        } else if (dto.getIdArea() == null && tarefa.getAreaCultivo() != null) {
            tarefa.setAreaCultivo(null);
        }
        if (dto.getIdCultivo() != null) {
            cultivoRepository.findById(dto.getIdCultivo()).ifPresent(tarefa::setCultivo);
        } else if (dto.getIdCultivo() == null && tarefa.getCultivo() != null) {
            tarefa.setCultivo(null);
        }

        logService.registrarLog(logado.getNomeUsuario(), "Editou dados da tarefa ID: " + id);
        return converterParaDTO(tarefaRepository.save(tarefa));
    }

    // CONCLUIR, COLOCAR EM OBSERVAÇÃO OU REABRIR TAREFA
    @Transactional
    public TarefaDTO concluirTarefa(Long id, Long idUsuarioLogado, ConclusaoTarefaDTO payload) {
        Tarefa t = tarefaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        // Se já está concluída → reabrir para pendente
        if (t.isConcluida()) {
            t.setConcluida(false);
            t.setDataConclusao(null);
            logService.registrarLog(u.getNomeUsuario(), "Reabriu tarefa: " + t.getTitulo());
            return converterParaDTO(tarefaRepository.save(t));
        }

        // Se está em observação → finalizar como concluída (aceita nota final opcional)
        if (t.isEmObservacao()) {
            if (payload != null && payload.getObservacao() != null && !payload.getObservacao().isBlank()) {
                t.setObservacaoConclusao(payload.getObservacao());
            }
            if (payload != null && payload.getFotoConclusao() != null) {
                t.setFotoConclusao(payload.getFotoConclusao());
            }
            t.setEmObservacao(false);
            t.setConcluida(true);
            t.setDataConclusao(LocalDateTime.now());
            logService.registrarLog(u.getNomeUsuario(), "Finalizou tarefa em observação: " + t.getTitulo());
            notificacaoService.criarNotificacao(t.getCriador().getIdUsuario(),
                    "Tarefa Finalizada", "A tarefa '" + t.getTitulo() + "' foi concluída definitivamente.", "sucesso");
            return converterParaDTO(tarefaRepository.save(t));
        }

        // Completando a partir de pendente: salvar dados do formulário
        String obs = (payload != null && payload.getObservacao() != null) ? payload.getObservacao() : "";
        t.setObservacaoConclusao(obs);

        if (payload != null && payload.getFotoConclusao() != null) {
            t.setFotoConclusao(payload.getFotoConclusao());
        }

        // Processar insumos usados: salvar JSON e subtrair do estoque
        if (payload != null && payload.getInsumosUsados() != null && !payload.getInsumosUsados().isEmpty()) {
            try {
                t.setInsumosUsadosJson(objectMapper.writeValueAsString(payload.getInsumosUsados()));
            } catch (Exception ignored) {}

            for (ConclusaoTarefaDTO.InsumoUsadoDTO insumo : payload.getInsumosUsados()) {
                if (insumo.getIdEstoque() == null || insumo.getQuantidade() == null) continue;
                estoqueService.descontarInsumo(
                        insumo.getIdEstoque(),
                        insumo.getQuantidade(),
                        u.getNomeUsuario(),
                        t.getTitulo()
                );
            }
        }

        t.setDataConclusao(LocalDateTime.now());

        // Determinar estado final: Observação ou Concluída
        String subcategoria = t.getSubcategoria();
        if (subcategoria != null && SUBCATEGORIAS_OBSERVACAO.contains(subcategoria)) {
            t.setEmObservacao(true);
            t.setConcluida(false);
            logService.registrarLog(u.getNomeUsuario(), "Registrou execução (em observação): " + t.getTitulo());
            notificacaoService.criarNotificacao(t.getCriador().getIdUsuario(),
                    "Tarefa em Observação",
                    "A tarefa '" + t.getTitulo() + "' foi executada e está em acompanhamento.", "aviso");
        } else {
            t.setConcluida(true);
            t.setEmObservacao(false);
            logService.registrarLog(u.getNomeUsuario(), "Concluiu tarefa: " + t.getTitulo());
            notificacaoService.criarNotificacao(t.getCriador().getIdUsuario(),
                    "Tarefa Concluída", "A tarefa '" + t.getTitulo() + "' foi finalizada.", "sucesso");
        }

        return converterParaDTO(tarefaRepository.save(t));
    }

    // ATUALIZAR OBSERVAÇÃO (mantém em observação com novo registro)
    @Transactional
    public TarefaDTO atualizarObservacaoTarefa(Long id, Long idUsuarioLogado, ConclusaoTarefaDTO payload) {
        Tarefa t = tarefaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!t.isEmObservacao()) {
            throw new RuntimeException("Tarefa não está em estado de observação.");
        }

        if (payload != null && payload.getObservacao() != null && !payload.getObservacao().isBlank()) {
            t.setObservacaoConclusao(payload.getObservacao());
        }
        if (payload != null && payload.getFotoConclusao() != null) {
            t.setFotoConclusao(payload.getFotoConclusao());
        }

        logService.registrarLog(u.getNomeUsuario(), "Atualizou observação da tarefa: " + t.getTitulo());

        notificacaoService.criarNotificacao(t.getCriador().getIdUsuario(),
                "Atualização de Observação",
                u.getNomeUsuario() + " registrou uma atualização na tarefa '" + t.getTitulo() + "'.", "info");

        return converterParaDTO(tarefaRepository.save(t));
    }

    // CANCELAR TAREFA
    @Transactional
    public TarefaDTO cancelarTarefa(Long id, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarPermissaoGestao(t, u);
        t.setCancelada(true);
        t.setConcluida(false);
        t.setEmObservacao(false);

        logService.registrarLog(u.getNomeUsuario(), "Cancelou tarefa: " + t.getTitulo());
        return converterParaDTO(tarefaRepository.save(t));
    }

    // EXCLUIR TAREFA
    @Transactional
    public void excluirTarefa(Long id, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
        Usuario u = usuarioRepository.findById(idUsuarioLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

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
                .filter(t -> !t.isConcluida() && !t.isCancelada() && !t.isEmObservacao())
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
        dto.setSubcategoria(t.getSubcategoria());
        dto.setInformacoesExtras(t.getInformacoesExtras());
        dto.setDataPrazo(t.getDataPrazo());
        dto.setIdResponsavel(t.getResponsavel().getIdUsuario());
        dto.setStatus(t.getStatus());
        dto.setConcluida(t.isConcluida());
        dto.setCancelada(t.isCancelada());
        dto.setEmObservacao(t.isEmObservacao());
        dto.setObservacaoConclusao(t.getObservacaoConclusao());
        dto.setFotoConclusao(t.getFotoConclusao());

        // Desserializar insumos do JSON para lista
        if (t.getInsumosUsadosJson() != null) {
            try {
                List<TarefaDTO.InsumoUsadoDTO> insumos = objectMapper.readValue(
                        t.getInsumosUsadosJson(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, TarefaDTO.InsumoUsadoDTO.class)
                );
                dto.setInsumosUsados(insumos);
            } catch (Exception ignored) {
                dto.setInsumosUsados(List.of());
            }
        }

        dto.setResponsavel(new TarefaDTO.UsuarioResumo(
                t.getResponsavel().getIdUsuario(),
                t.getResponsavel().getNomeUsuario()
        ));

        if (t.getCriador() != null) {
            dto.setCriador(new TarefaDTO.UsuarioResumo(
                    t.getCriador().getIdUsuario(),
                    t.getCriador().getNomeUsuario()
            ));
        }

        if (t.getAreaCultivo() != null) {
            dto.setIdArea(t.getAreaCultivo().getIdArea());
            dto.setNomeArea(t.getAreaCultivo().getNomeArea());
        }
        if (t.getCultivo() != null) {
            dto.setIdCultivo(t.getCultivo().getIdCultivo());
            dto.setNomeCultivo(t.getCultivo().getPlantaCultivada() != null
                    ? t.getCultivo().getPlantaCultivada().getNomePopular()
                    : "Cultivo #" + t.getCultivo().getIdCultivo());
        }

        return dto;
    }
}
