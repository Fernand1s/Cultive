package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.*;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    private final CultivoRepository cultivoRepository;
    private final PlantaRepository plantaRepository;
    private final AreaCultivoRepository areaCultivoRepository;
    private final EstoqueRepository estoqueRepository;
    private final TarefaRepository tarefaRepository;

    public RelatorioService(CultivoRepository cultivoRepository,
                            PlantaRepository plantaRepository,
                            AreaCultivoRepository areaCultivoRepository,
                            EstoqueRepository estoqueRepository,
                            TarefaRepository tarefaRepository) {
        this.cultivoRepository = cultivoRepository;
        this.plantaRepository = plantaRepository;
        this.areaCultivoRepository = areaCultivoRepository;
        this.estoqueRepository = estoqueRepository;
        this.tarefaRepository = tarefaRepository;
    }

    // ===================== EXISTENTES =====================

    @Transactional(readOnly = true)
    public CompatibilidadeDTO verificarCompatibilidadeTotal(Long idPlanta, Long idArea) {
        Planta planta = plantaRepository.findById(idPlanta)
                .orElseThrow(() -> new ResourceNotFoundException("Planta não encontrada"));
        AreaCultivo area = areaCultivoRepository.findById(idArea)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada"));

        boolean soloOk = planta.getSolosRecomendados().contains(area.getTipoSolo());
        boolean luzOk = (planta.getLuzRecomendada() == area.getQuantidadeLuz());

        String mensagem = "Ambiente ideal para esta espécie.";
        if (!soloOk || !luzOk) {
            mensagem = (!soloOk ? "Solo incompatível. " : "") + (!luzOk ? "Luz inadequada." : "");
        }

        return new CompatibilidadeDTO(soloOk && luzOk, mensagem);
    }

    @Transactional(readOnly = true)
    public ConsumoAguaDTO calcularTotalAguaCultivo(Long idCultivo) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado"));

        double totalVolume = cultivo.getEventosRegistrados().stream()
                .filter(e -> e instanceof Irrigacao)
                .mapToDouble(e -> ((Irrigacao) e).getVolumeAgua())
                .sum();

        return new ConsumoAguaDTO(idCultivo, cultivo.getPlanta().getNomePopular(), totalVolume);
    }

    @Transactional(readOnly = true)
    public List<HistoricoPragaDTO> obterHistoricoPragasDTO(Long idCultivo) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado"));

        return cultivo.getEventosRegistrados().stream()
                .filter(e -> e instanceof DoencaPraga)
                .map(e -> {
                    DoencaPraga dp = (DoencaPraga) e;
                    return new HistoricoPragaDTO(
                            dp.getNomePragaOuDoenca(),
                            dp.getNivelAfetacao().toString(),
                            dp.getDataHora(),
                            dp.getObservacaoEvento()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public double calcularTotalColhidoArea(Long idArea) {
        return cultivoRepository.sumQuantidadeColhidaByArea(idArea);
    }

    // ===================== PRODUÇÃO E SAFRA =====================

    @Transactional(readOnly = true)
    public List<ProdutividadeDTO> calcularProdutividade(Long idArea) {
        List<Cultivo> cultivos = idArea != null
                ? cultivoRepository.findAll().stream()
                    .filter(c -> c.getAreaCultivo() != null && c.getAreaCultivo().getIdArea().equals(idArea))
                    .collect(Collectors.toList())
                : cultivoRepository.findAll();

        return cultivos.stream().map(c -> {
            Double tamanho = c.getAreaCultivo() != null ? c.getAreaCultivo().getTamanhoArea() : null;
            double colhida = c.getQuantidadeColhida();
            Double produtividade = (tamanho != null && tamanho > 0) ? colhida / tamanho : null;

            return new ProdutividadeDTO(
                    c.getIdCultivo(),
                    c.getPlanta() != null ? c.getPlanta().getNomePopular() : "N/A",
                    c.getAreaCultivo() != null ? c.getAreaCultivo().getNomeArea() : "N/A",
                    tamanho,
                    colhida,
                    c.getUnidadeMedida(),
                    produtividade != null ? Math.round(produtividade * 100.0) / 100.0 : null,
                    c.getDataPlantio() != null ? c.getDataPlantio().toString() : null,
                    c.getDataColheitaFinal() != null ? c.getDataColheitaFinal().toString() : null,
                    c.getStatusCultivo() != null ? c.getStatusCultivo().toString() : null,
                    c.getEstadoPlanta() != null ? c.getEstadoPlanta().toString() : null
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CadernoCampoDTO gerarCadernoCampo(Long idCultivo) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado"));

        List<Evento> eventos = cultivo.getEventosRegistrados();

        List<HistoricoPragaDTO> pragas = eventos.stream()
                .filter(e -> e instanceof DoencaPraga)
                .map(e -> {
                    DoencaPraga dp = (DoencaPraga) e;
                    return new HistoricoPragaDTO(
                            dp.getNomePragaOuDoenca(),
                            dp.getNivelAfetacao().toString(),
                            dp.getDataHora(),
                            dp.getObservacaoEvento()
                    );
                })
                .sorted(Comparator.comparing(HistoricoPragaDTO::getData, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<ColheitaResumoDTO> colheitas = eventos.stream()
                .filter(e -> e instanceof Colheita)
                .map(e -> {
                    Colheita col = (Colheita) e;
                    return new ColheitaResumoDTO(
                            col.getDataHora() != null ? col.getDataHora().toString() : null,
                            col.getQuantidadeColhida(),
                            col.getUnidadeMedida(),
                            col.getObservacaoEvento()
                    );
                })
                .sorted(Comparator.comparing(ColheitaResumoDTO::getDataHora, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        long totalIrrigacoes = eventos.stream().filter(e -> e instanceof Irrigacao).count();
        double totalAgua = eventos.stream()
                .filter(e -> e instanceof Irrigacao)
                .mapToDouble(e -> ((Irrigacao) e).getVolumeAgua())
                .sum();

        List<String> responsaveis = Collections.emptyList();
        if (cultivo.getAreaCultivo() != null && cultivo.getAreaCultivo().getUsuariosResponsaveis() != null) {
            responsaveis = cultivo.getAreaCultivo().getUsuariosResponsaveis().stream()
                    .map(u -> u.getNomeUsuario() + " (" + (u.getFuncao() != null ? u.getFuncao().toString() : "N/A") + ")")
                    .collect(Collectors.toList());
        }

        CadernoCampoDTO dto = new CadernoCampoDTO();
        dto.setIdCultivo(cultivo.getIdCultivo());
        dto.setNomePlanta(cultivo.getPlanta() != null ? cultivo.getPlanta().getNomePopular() : "N/A");
        dto.setNomeCientifico(cultivo.getPlanta() != null ? cultivo.getPlanta().getNomeCientifico() : null);
        dto.setNomeArea(cultivo.getAreaCultivo() != null ? cultivo.getAreaCultivo().getNomeArea() : "N/A");
        dto.setDataPlantio(cultivo.getDataPlantio() != null ? cultivo.getDataPlantio().toString() : null);
        dto.setPrevisaoColheita(cultivo.getPrevisaoColheita() != null ? cultivo.getPrevisaoColheita().toString() : null);
        dto.setDataEncerramento(cultivo.getDataColheitaFinal() != null ? cultivo.getDataColheitaFinal().toString() : null);
        dto.setStatusCultivo(cultivo.getStatusCultivo() != null ? cultivo.getStatusCultivo().toString() : null);
        dto.setEstadoPlanta(cultivo.getEstadoPlanta() != null ? cultivo.getEstadoPlanta().toString() : null);
        dto.setQuantidadePlantada(cultivo.getQuantidadePlantada());
        dto.setQuantidadeColhida(cultivo.getQuantidadeColhida());
        dto.setUnidadeMedida(cultivo.getUnidadeMedida());
        dto.setObservacao(cultivo.getObservacaoCultivo());
        dto.setPragas(pragas);
        dto.setColheitas(colheitas);
        dto.setTotalIrrigacoes((int) totalIrrigacoes);
        dto.setTotalAguaLitros(totalAgua);
        dto.setResponsaveis(responsaveis);

        return dto;
    }

    // ===================== FITOSSANITÁRIO =====================

    @Transactional(readOnly = true)
    public List<IncidenciaPragaDTO> mapearIncidenciaPragas(Long idArea, Long idPlanta) {
        List<Cultivo> cultivos = cultivoRepository.findAll().stream()
                .filter(c -> idArea == null || (c.getAreaCultivo() != null && c.getAreaCultivo().getIdArea().equals(idArea)))
                .filter(c -> idPlanta == null || (c.getPlanta() != null && c.getPlanta().getIdPlanta().equals(idPlanta)))
                .collect(Collectors.toList());

        Map<String, List<DoencaPraga>> agrupado = new LinkedHashMap<>();

        for (Cultivo c : cultivos) {
            for (Evento e : c.getEventosRegistrados()) {
                if (e instanceof DoencaPraga dp) {
                    agrupado.computeIfAbsent(dp.getNomePragaOuDoenca(), k -> new ArrayList<>()).add(dp);
                }
            }
        }

        int[] nivelOrdem = {0};
        Map<String, Integer> ordemNivel = new HashMap<>();
        ordemNivel.put("CRITICO", 4);
        ordemNivel.put("ALTO", 3);
        ordemNivel.put("MEDIO", 2);
        ordemNivel.put("BAIXO", 1);

        return agrupado.entrySet().stream().map(entry -> {
            String nome = entry.getKey();
            List<DoencaPraga> ocorrencias = entry.getValue();

            String nivelGrave = ocorrencias.stream()
                    .map(dp -> dp.getNivelAfetacao() != null ? dp.getNivelAfetacao().toString() : "BAIXO")
                    .max(Comparator.comparingInt(n -> ordemNivel.getOrDefault(n, 0)))
                    .orElse("N/A");

            // Área mais afetada: a que tem mais ocorrências desta praga
            Map<String, Long> contPorArea = ocorrencias.stream()
                    .collect(Collectors.groupingBy(
                            dp -> dp.getCultivo() != null && dp.getCultivo().getAreaCultivo() != null
                                    ? dp.getCultivo().getAreaCultivo().getNomeArea() : "N/A",
                            Collectors.counting()));
            String areaMaisAfetada = contPorArea.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse("N/A");

            Map<String, Long> contPorPlanta = ocorrencias.stream()
                    .collect(Collectors.groupingBy(
                            dp -> dp.getCultivo() != null && dp.getCultivo().getPlanta() != null
                                    ? dp.getCultivo().getPlanta().getNomePopular() : "N/A",
                            Collectors.counting()));
            String plantaMaisAfetada = contPorPlanta.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse("N/A");

            String ultimaOcorrencia = ocorrencias.stream()
                    .map(DoencaPraga::getDataHora)
                    .filter(Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .map(d -> d.toLocalDate().toString())
                    .orElse("N/A");

            return new IncidenciaPragaDTO(nome, (long) ocorrencias.size(), nivelGrave,
                    areaMaisAfetada, plantaMaisAfetada, ultimaOcorrencia);
        })
        .sorted(Comparator.comparingLong(IncidenciaPragaDTO::getOcorrencias).reversed())
        .collect(Collectors.toList());
    }

    // ===================== ESTOQUE E CONSUMO =====================

    @Transactional(readOnly = true)
    public List<AlertaEstoqueDTO> gerarAlertasEstoque() {
        return estoqueRepository.findAll().stream()
                .filter(e -> e.getQuantidadeEstoque() != null && e.getEstoqueMinimo() != null
                        && e.getQuantidadeEstoque() <= e.getEstoqueMinimo())
                .map(e -> {
                    long deficit = e.getEstoqueMinimo() - e.getQuantidadeEstoque();
                    String situacao = e.getQuantidadeEstoque() <= (e.getEstoqueMinimo() / 2) ? "CRITICO" : "ALERTA";
                    return new AlertaEstoqueDTO(
                            e.getIdEstoque(), e.getNome(), e.getCategoria(), e.getSubcategoria(),
                            e.getQuantidadeEstoque(), e.getEstoqueMinimo(), deficit,
                            situacao, e.getUnidadeMedida(), e.getValidade()
                    );
                })
                .sorted(Comparator.comparingLong(AlertaEstoqueDTO::getDeficit).reversed())
                .collect(Collectors.toList());
    }

    // ===================== OCUPAÇÃO E SOLO =====================

    @Transactional(readOnly = true)
    public List<RotacaoCulturaDTO> calcularRotacaoCulturas(Long idArea) {
        List<AreaCultivo> areas = idArea != null
                ? areaCultivoRepository.findById(idArea).map(List::of).orElse(Collections.emptyList())
                : areaCultivoRepository.findAll();

        List<Cultivo> todosCultivos = cultivoRepository.findAll();
        Map<Long, List<Cultivo>> cultivosPorArea = todosCultivos.stream()
                .filter(c -> c.getAreaCultivo() != null)
                .collect(Collectors.groupingBy(c -> c.getAreaCultivo().getIdArea()));

        return areas.stream().map(area -> {
            List<CicloAreaDTO> historico = cultivosPorArea.getOrDefault(area.getIdArea(), Collections.emptyList())
                    .stream()
                    .sorted(Comparator.comparing(Cultivo::getDataPlantio, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(c -> new CicloAreaDTO(
                            c.getIdCultivo(),
                            c.getPlanta() != null ? c.getPlanta().getNomePopular() : "N/A",
                            c.getStatusCultivo() != null ? c.getStatusCultivo().toString() : null,
                            c.getDataPlantio() != null ? c.getDataPlantio().toString() : null,
                            c.getDataColheitaFinal() != null ? c.getDataColheitaFinal().toString() : null,
                            c.getQuantidadeColhida(),
                            c.getUnidadeMedida()
                    ))
                    .collect(Collectors.toList());

            return new RotacaoCulturaDTO(
                    area.getIdArea(), area.getNomeArea(), area.getTamanhoArea(),
                    area.getStatusArea() != null ? area.getStatusArea().toString() : null,
                    historico
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OcupacaoAreaDTO> calcularOcupacaoAreas() {
        LocalDate hoje = LocalDate.now();
        List<Cultivo> todosCultivos = cultivoRepository.findAll();
        Map<Long, List<Cultivo>> cultivosPorArea = todosCultivos.stream()
                .filter(c -> c.getAreaCultivo() != null)
                .collect(Collectors.groupingBy(c -> c.getAreaCultivo().getIdArea()));

        return areaCultivoRepository.findAll().stream().map(area -> {
            List<Cultivo> cultivosDaArea = cultivosPorArea.getOrDefault(area.getIdArea(), Collections.emptyList())
                    .stream()
                    .filter(c -> c.getDataPlantio() != null)
                    .collect(Collectors.toList());

            if (cultivosDaArea.isEmpty()) {
                return new OcupacaoAreaDTO(area.getIdArea(), area.getNomeArea(), area.getTamanhoArea(),
                        area.getStatusArea() != null ? area.getStatusArea().toString() : null,
                        0L, 0L, 0L, 0.0, 0);
            }

            LocalDate inicio = cultivosDaArea.stream()
                    .map(Cultivo::getDataPlantio)
                    .min(Comparator.naturalOrder()).orElse(hoje);

            long totalDiasPeriodo = Math.max(1, ChronoUnit.DAYS.between(inicio, hoje));
            long diasOcupados = cultivosDaArea.stream().mapToLong(c -> {
                LocalDate fim = c.getDataColheitaFinal() != null ? c.getDataColheitaFinal() : hoje;
                return Math.max(0, ChronoUnit.DAYS.between(c.getDataPlantio(), fim));
            }).sum();

            diasOcupados = Math.min(diasOcupados, totalDiasPeriodo);
            long diasOciosos = Math.max(0, totalDiasPeriodo - diasOcupados);
            double taxa = (double) diasOcupados / totalDiasPeriodo * 100;
            taxa = Math.round(taxa * 10.0) / 10.0;

            return new OcupacaoAreaDTO(
                    area.getIdArea(), area.getNomeArea(), area.getTamanhoArea(),
                    area.getStatusArea() != null ? area.getStatusArea().toString() : null,
                    diasOcupados, diasOciosos, totalDiasPeriodo, taxa, cultivosDaArea.size()
            );
        }).sorted(Comparator.comparingDouble(OcupacaoAreaDTO::getTaxaOcupacao).reversed())
                .collect(Collectors.toList());
    }

    // ===================== EQUIPE E OPERAÇÕES =====================

    @Transactional(readOnly = true)
    public List<DesempenhoEquipeDTO> calcularDesempenhoEquipe() {
        List<Tarefa> todas = tarefaRepository.findAll();

        Map<Long, List<Tarefa>> porUsuario = todas.stream()
                .filter(t -> t.getResponsavel() != null)
                .collect(Collectors.groupingBy(t -> t.getResponsavel().getIdUsuario()));

        return porUsuario.entrySet().stream().map(entry -> {
            Usuario usuario = entry.getValue().get(0).getResponsavel();
            List<Tarefa> tarefas = entry.getValue();

            long concluidas = tarefas.stream().filter(Tarefa::isConcluida).count();
            long canceladas = tarefas.stream().filter(Tarefa::isCancelada).count();
            long pendentes = tarefas.stream().filter(t -> !t.isConcluida() && !t.isCancelada()).count();

            long atrasadasConcluidas = tarefas.stream()
                    .filter(t -> t.isConcluida() && t.getDataConclusao() != null && t.getDataPrazo() != null
                            && t.getDataConclusao().isAfter(t.getDataPrazo()))
                    .count();
            long atrasadasPendentes = tarefas.stream()
                    .filter(t -> !t.isConcluida() && !t.isCancelada()
                            && t.getDataPrazo() != null
                            && t.getDataPrazo().isBefore(LocalDateTime.now()))
                    .count();
            long totalAtrasadas = atrasadasConcluidas + atrasadasPendentes;

            double tempoMedio = tarefas.stream()
                    .filter(t -> t.isConcluida() && t.getDataConclusao() != null && t.getDataCriacao() != null)
                    .mapToLong(t -> ChronoUnit.DAYS.between(t.getDataCriacao(), t.getDataConclusao()))
                    .average()
                    .orElse(0.0);

            long ativas = concluidas + pendentes;
            double taxa = ativas > 0 ? Math.round((double) concluidas / ativas * 1000.0) / 10.0 : 0.0;

            return new DesempenhoEquipeDTO(
                    usuario.getIdUsuario(),
                    usuario.getNomeUsuario(),
                    usuario.getFuncao() != null ? usuario.getFuncao().toString() : "N/A",
                    concluidas, totalAtrasadas, canceladas, pendentes,
                    (long) tarefas.size(), taxa,
                    Math.round(tempoMedio * 10.0) / 10.0
            );
        })
        .sorted(Comparator.comparingLong(DesempenhoEquipeDTO::getTarefasConcluidas).reversed())
        .collect(Collectors.toList());
    }
}
