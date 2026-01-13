package br.com.cultiva.cultivamais.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import br.com.cultiva.cultivamais.model.Tarefa;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.TarefaRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;

@Service
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LogService logService;

    private final NotificacaoService notificacaoService;

    public TarefaService(TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository, LogService logService, NotificacaoService notificacaoService) {
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.logService = logService;
        this.notificacaoService = notificacaoService;
    }

    // CRIAR
    public Tarefa criarTarefa(Long idCriador, Long idResponsavel, Tarefa novaTarefa) {
        Usuario criador = usuarioRepository.findById(idCriador).orElse(null);
        Usuario responsavel = usuarioRepository.findById(idResponsavel).orElse(null);

        if (criador != null) {
            novaTarefa.setCriador(criador);
            novaTarefa.setResponsavel(responsavel != null ? responsavel : criador);
            novaTarefa.setConcluida(false);
            novaTarefa.setCancelada(false);
            novaTarefa.setDataCriacao(LocalDateTime.now());

            Tarefa salva = tarefaRepository.save(novaTarefa);

            logService.registrarLog(criador.getNomeUsuario(),
                    "Criou a tarefa \"" + salva.getTitulo() + "\" para " + salva.getResponsavel().getNomeUsuario());

            // NOTIFICAÇÃO
            if (responsavel != null) {
                notificacaoService.criarNotificacao(
                        responsavel.getIdUsuario(),
                        "Nova Tarefa Atribuída",
                        "Você foi designado para: " + salva.getTitulo(),
                        "info"
                );
            }

            return salva;
        }
        return null;
    }

    // LISTAR TODAS
    public List<Tarefa> listarTodas() {
        return tarefaRepository.findAll();
    }

    // LISTAR POR USUÁRIO
    public List<Tarefa> listarTarefasPorUsuario(Long idUsuario, String funcao) {
        if ("ADMIN".equalsIgnoreCase(funcao) || "ADMINISTRADOR".equalsIgnoreCase(funcao)) {
            return tarefaRepository.findAll();
        } else {
            return tarefaRepository.findByResponsavel_IdUsuarioOrCriador_IdUsuario(idUsuario, idUsuario);
        }
    }

    // ATUALIZAR
    public Tarefa atualizarTarefa(Long idTarefa, Tarefa dadosNovos, Long idUsuarioLogado) {
        Tarefa tarefa = tarefaRepository.findById(idTarefa).orElse(null);
        Usuario quemEditou = usuarioRepository.findById(idUsuarioLogado).orElse(null);

        if (tarefa != null && quemEditou != null) {

            boolean isCriador = tarefa.getCriador().getIdUsuario().equals(idUsuarioLogado);
            boolean isAdmin = quemEditou.getFuncao().toString().contains("ADMIN") || quemEditou.getFuncao().toString().contains("EMPRESA");

            if (!isCriador && !isAdmin) {
                throw new RuntimeException("Permissão negada: Apenas o criador ou admin podem editar.");
            }

            String tituloAntigo = tarefa.getTitulo();

            tarefa.setTitulo(dadosNovos.getTitulo());
            tarefa.setDescricao(dadosNovos.getDescricao());
            tarefa.setPrioridade(dadosNovos.getPrioridade());
            tarefa.setCategoria(dadosNovos.getCategoria());
            tarefa.setDataPrazo(dadosNovos.getDataPrazo());

            if (dadosNovos.getResponsavel() != null && dadosNovos.getResponsavel().getIdUsuario() != null) {
                Usuario novoResponsavel = usuarioRepository.findById(dadosNovos.getResponsavel().getIdUsuario()).orElse(null);

                if (novoResponsavel != null && !novoResponsavel.equals(tarefa.getResponsavel())) {
                    tarefa.setResponsavel(novoResponsavel);

                    notificacaoService.criarNotificacao(
                            novoResponsavel.getIdUsuario(),
                            "Tarefa Transferida",
                            "A tarefa '" + tarefa.getTitulo() + "' foi repassada para você.",
                            "info"
                    );
                }
            }

            Tarefa salva = tarefaRepository.save(tarefa);

            logService.registrarLog(quemEditou.getNomeUsuario(),
                    "Editou a tarefa \"" + tituloAntigo + "\" (Agora: " + salva.getTitulo() + ")");

            return salva;
        }
        return null;
    }

    // CONCLUIR COM OBSERVAÇÃO
    public Tarefa concluirTarefa(Long idTarefa, Long idUsuarioLogado, String observacao) {
        Tarefa t = tarefaRepository.findById(idTarefa).orElse(null);
        Usuario quemFez = usuarioRepository.findById(idUsuarioLogado).orElse(null);

        if (t != null && quemFez != null) {
            boolean vaiConcluir = !t.isConcluida();
            t.setConcluida(vaiConcluir);

            if (vaiConcluir) {

                t.setDataConclusao(LocalDateTime.now());
                t.setObservacaoConclusao(observacao);
                logService.registrarLog(quemFez.getNomeUsuario(), "Concluiu a tarefa \"" + t.getTitulo() + "\". Obs: " + observacao);

                if (!t.getCriador().getIdUsuario().equals(quemFez.getIdUsuario())) {
                    notificacaoService.criarNotificacao(
                            t.getCriador().getIdUsuario(),
                            "Tarefa Concluída",
                            quemFez.getNomeUsuario() + " finalizou: " + t.getTitulo(),
                            "sucesso"
                    );
                }

            } else {
                t.setDataConclusao(null);
                t.setObservacaoConclusao(null);
                logService.registrarLog(quemFez.getNomeUsuario(), "Reabriu a tarefa \"" + t.getTitulo() + "\"");
            }
            return tarefaRepository.save(t);
        }
        return null;
    }

    // CANCELAR
    public Tarefa cancelarTarefa(Long idTarefa, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(idTarefa).orElse(null);
        Usuario quemCancelou = usuarioRepository.findById(idUsuarioLogado).orElse(null);

        if (t != null && quemCancelou != null) {
            boolean isCriador = t.getCriador().getIdUsuario().equals(idUsuarioLogado);
            boolean isAdmin = quemCancelou.getFuncao().toString().contains("ADMIN") || quemCancelou.getFuncao().toString().contains("EMPRESA");

            if (isCriador || isAdmin) {
                t.setCancelada(true);
                t.setConcluida(false);

                logService.registrarLog(quemCancelou.getNomeUsuario(), "Cancelou a tarefa \"" + t.getTitulo() + "\"");

                if (!t.getResponsavel().getIdUsuario().equals(quemCancelou.getIdUsuario())) {
                    notificacaoService.criarNotificacao(
                            t.getResponsavel().getIdUsuario(),
                            "Tarefa Cancelada",
                            "A tarefa '" + t.getTitulo() + "' foi cancelada pelo gestor.",
                            "alerta"
                    );
                }

                return tarefaRepository.save(t);
            }
        }
        return null;
    }

    // EXCLUIR
    public boolean excluirTarefa(Long idTarefa, Long idUsuarioLogado) {
        Tarefa t = tarefaRepository.findById(idTarefa).orElse(null);
        Usuario quemExclui = usuarioRepository.findById(idUsuarioLogado).orElse(null);

        if (t != null && quemExclui != null) {
            boolean isCriador = t.getCriador().getIdUsuario().equals(idUsuarioLogado);
            boolean isAdmin = quemExclui.getFuncao().toString().contains("ADMIN") || quemExclui.getFuncao().toString().contains("EMPRESA");

            if (isCriador || isAdmin) {
                String titulo = t.getTitulo();
                tarefaRepository.deleteById(idTarefa);
                logService.registrarLog(quemExclui.getNomeUsuario(), "Excluiu a tarefa \"" + titulo + "\"");
                return true;
            }
        }
        return false;
    }

    // VERIFICA TAREFAS ATRASADAS
    @Scheduled(cron = "0 0 8 * * *")
    public void verificarTarefasAtrasadas() {
        System.out.println(">>> Verificando tarefas atrasadas...");

        List<Tarefa> tarefas = tarefaRepository.findAll();
        LocalDate hoje = LocalDate.now();

        for (Tarefa t : tarefas) {
            if (t.isConcluida() || t.isCancelada()) continue;

            if (t.getDataPrazo() != null && t.getDataPrazo().toLocalDate().isBefore(hoje)) {

                notificacaoService.criarNotificacao(
                        t.getResponsavel().getIdUsuario(),
                        "Tarefa Atrasada",
                        "Atenção: A tarefa '" + t.getTitulo() + "' venceu em " + t.getDataPrazo(),
                        "erro"
                );
            }
        }
    }
}