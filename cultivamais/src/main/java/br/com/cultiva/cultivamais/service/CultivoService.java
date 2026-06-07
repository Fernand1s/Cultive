package br.com.cultiva.cultivamais.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import br.com.cultiva.cultivamais.dto.ColheitaDTO;
import br.com.cultiva.cultivamais.dto.CultivoRequestDTO;
import br.com.cultiva.cultivamais.dto.EncerrarCultivoDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.*;
import br.com.cultiva.cultivamais.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CultivoService {

    private final CultivoRepository cultivoRepository;
    private final PlantaRepository plantaRepository;
    private final AreaCultivoRepository areaCultivoRepository;
    private final ColheitaRepository colheitaRepository;
    private final EstoqueService estoqueService;
    private final NotificacaoService notificacaoService;
    private final ObjectMapper objectMapper;

    public CultivoService(CultivoRepository cultivoRepository,
                          PlantaRepository plantaRepository,
                          AreaCultivoRepository areaCultivoRepository,
                          ColheitaRepository colheitaRepository,
                          EstoqueService estoqueService,
                          NotificacaoService notificacaoService,
                          ObjectMapper objectMapper) {
        this.cultivoRepository = cultivoRepository;
        this.plantaRepository = plantaRepository;
        this.areaCultivoRepository = areaCultivoRepository;
        this.colheitaRepository = colheitaRepository;
        this.estoqueService = estoqueService;
        this.notificacaoService = notificacaoService;
        this.objectMapper = objectMapper;
    }

    // CRIAR CULTIVO
    @Transactional
    public Cultivo criarCultivo(Long idPlanta, Long idArea, double quantidadePlantada, LocalDate dataPlantio) {
        return criarCultivoDtoCompleto(idPlanta, idArea, quantidadePlantada, dataPlantio, null);
    }

    @Transactional
    public Cultivo criarCultivoDtoCompleto(Long idPlanta, Long idArea, double quantidadePlantada,
                                            LocalDate dataPlantio, CultivoRequestDTO dto) {
        Planta planta = plantaRepository.findById(idPlanta)
                .orElseThrow(() -> new ResourceNotFoundException("Planta não encontrada: " + idPlanta));
        AreaCultivo area = areaCultivoRepository.findById(idArea)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada: " + idArea));

        Cultivo novoCultivo = new Cultivo(planta, area, dataPlantio, quantidadePlantada);

        if (dto != null) {
            if (dto.getTipoCiclo() != null) novoCultivo.setTipoCiclo(dto.getTipoCiclo());
            if (dto.getUnidadeMedida() != null) novoCultivo.setUnidadeMedida(dto.getUnidadeMedida());
            if (dto.getStatusCultivo() != null) novoCultivo.setStatusCultivo(dto.getStatusCultivo());
            if (dto.getObservacaoCultivo() != null) novoCultivo.setObservacaoCultivo(dto.getObservacaoCultivo());
        }

        // Atualizar status da área para EM_CULTIVO
        area.setStatusArea(StatusArea.EM_CULTIVO);
        areaCultivoRepository.save(area);

        return cultivoRepository.save(novoCultivo);
    }

    // LISTAR TODOS
    public List<Cultivo> listarTodos() {
        return cultivoRepository.findAll();
    }

    // BUSCAR POR ID
    public Cultivo buscarPorId(Long id) {
        return cultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado com ID: " + id));
    }

    // ATUALIZAR
    @Transactional
    public Cultivo atualizarCultivo(Long id, CultivoRequestDTO dadosNovos) {
        Cultivo cultivo = cultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado com ID: " + id));

        if (dadosNovos.getQuantidadePlantada() > 0)
            cultivo.setQuantidadePlantada(dadosNovos.getQuantidadePlantada());
        if (dadosNovos.getObservacaoCultivo() != null)
            cultivo.setObservacaoCultivo(dadosNovos.getObservacaoCultivo());
        if (dadosNovos.getEstadoPlanta() != null)
            cultivo.setEstadoPlanta(dadosNovos.getEstadoPlanta());
        if (dadosNovos.getTipoCiclo() != null)
            cultivo.setTipoCiclo(dadosNovos.getTipoCiclo());
        if (dadosNovos.getUnidadeMedida() != null)
            cultivo.setUnidadeMedida(dadosNovos.getUnidadeMedida());

        if (dadosNovos.getStatusCultivo() != null
                && dadosNovos.getStatusCultivo() != cultivo.getStatusCultivo()) {
            StatusCultivo anterior = cultivo.getStatusCultivo();
            StatusCultivo novo = dadosNovos.getStatusCultivo();
            cultivo.setStatusCultivo(novo);

            boolean eraAtivo = anterior == StatusCultivo.ATIVO || anterior == StatusCultivo.EM_PRODUCAO
                    || anterior == StatusCultivo.EM_PREPARO;
            boolean ficouInativo = novo == StatusCultivo.COLHIDO || novo == StatusCultivo.CANCELADO;

            boolean eraInativo = anterior == StatusCultivo.COLHIDO || anterior == StatusCultivo.CANCELADO;
            boolean ficouAtivo = novo == StatusCultivo.ATIVO || novo == StatusCultivo.EM_PRODUCAO;

            if (eraAtivo && ficouInativo) {
                liberarArea(cultivo.getAreaCultivo());
                if (novo == StatusCultivo.COLHIDO && cultivo.getDataColheitaFinal() == null) {
                    cultivo.setDataColheitaFinal(LocalDate.now());
                }
            } else if (eraInativo && ficouAtivo && cultivo.getAreaCultivo() != null) {
                cultivo.getAreaCultivo().setStatusArea(StatusArea.EM_CULTIVO);
                areaCultivoRepository.save(cultivo.getAreaCultivo());
            }
        }

        return cultivoRepository.save(cultivo);
    }

    // REGISTRAR COLHEITA (evento de apanha)
    @Transactional
    public Colheita registrarColheita(Long idCultivo, ColheitaDTO dto) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        LocalDateTime dataHora = dto.getDataHora() != null ? dto.getDataHora() : LocalDateTime.now();

        Colheita colheita = new Colheita(cultivo, dataHora, dto.getObservacao(),
                dto.getQuantidadeColhida(), dto.getUnidadeMedida());
        colheita.setFotoColheita(dto.getFotoColheita());

        // Processar insumos usados
        if (dto.getInsumosUsados() != null && !dto.getInsumosUsados().isEmpty()) {
            try {
                colheita.setInsumosUsadosJson(objectMapper.writeValueAsString(dto.getInsumosUsados()));
            } catch (Exception ignored) {}

            String nomePlanta = cultivo.getPlantaCultivada().getNomePopular();
            for (ColheitaDTO.InsumoUsadoItem insumo : dto.getInsumosUsados()) {
                if (insumo.getIdEstoque() == null || insumo.getQuantidade() == null) continue;
                estoqueService.descontarInsumo(
                        insumo.getIdEstoque(),
                        insumo.getQuantidade(),
                        dto.getIdUsuario() != null ? "Cultivo #" + idCultivo : "Sistema",
                        "Colheita de " + nomePlanta
                );
            }
        }

        Colheita salva = colheitaRepository.save(colheita);

        // Acumular quantidade colhida no cultivo
        cultivo.setQuantidadeColhida(cultivo.getQuantidadeColhida() + dto.getQuantidadeColhida());

        // Se ciclo contínuo e ainda ATIVO → promover para EM_PRODUCAO
        if (cultivo.getTipoCiclo() == TipoCiclo.CONTINUO
                && cultivo.getStatusCultivo() == StatusCultivo.ATIVO) {
            cultivo.setStatusCultivo(StatusCultivo.EM_PRODUCAO);
        }
        // Se ciclo único → encerrar automaticamente
        if (cultivo.getTipoCiclo() == TipoCiclo.UNICO) {
            cultivo.setStatusCultivo(StatusCultivo.COLHIDO);
            cultivo.setDataColheitaFinal(LocalDate.now());
            liberarArea(cultivo.getAreaCultivo());
        }

        cultivoRepository.save(cultivo);

        if (dto.getIdUsuario() != null) {
            notificacaoService.criarNotificacao(dto.getIdUsuario(), "Colheita Registrada",
                    "Apanha de " + dto.getQuantidadeColhida() + " " + dto.getUnidadeMedida()
                    + " registrada para " + cultivo.getPlantaCultivada().getNomePopular(), "sucesso");
        }

        return salva;
    }

    // ENCERRAR SAFRA (manual)
    @Transactional
    public Cultivo encerrarCultivo(Long idCultivo, EncerrarCultivoDTO dto) {
        Cultivo cultivo = cultivoRepository.findById(idCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo não encontrado: " + idCultivo));

        cultivo.setStatusCultivo(StatusCultivo.COLHIDO);
        cultivo.setDataColheitaFinal(dto.getDataEncerramento() != null ? dto.getDataEncerramento() : LocalDate.now());
        if (dto.getMotivoEncerramento() != null && !dto.getMotivoEncerramento().isBlank()) {
            cultivo.setObservacaoCultivo(dto.getMotivoEncerramento());
        }

        liberarArea(cultivo.getAreaCultivo());

        if (dto.getIdUsuario() != null) {
            notificacaoService.criarNotificacao(dto.getIdUsuario(), "Safra Encerrada",
                    "O cultivo de " + cultivo.getPlantaCultivada().getNomePopular() + " foi encerrado.", "info");
        }

        return cultivoRepository.save(cultivo);
    }

    private void liberarArea(AreaCultivo area) {
        if (area != null) {
            area.setStatusArea(StatusArea.PRONTO_PARA_PLANTIO);
            areaCultivoRepository.save(area);
        }
    }

    // LISTAR COLHEITAS DE UM CULTIVO
    public List<Colheita> listarColheitas(Long idCultivo) {
        return colheitaRepository.findByCultivo_IdCultivoOrderByDataHoraDesc(idCultivo);
    }

    // EXCLUIR
    @Transactional
    public void excluirCultivo(Long id) {
        if (!cultivoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cultivo não encontrado para exclusão.");
        }
        // Liberar área quando excluir cultivo ativo
        Cultivo c = cultivoRepository.findById(id).get();
        if (c.getStatusCultivo() == StatusCultivo.ATIVO || c.getStatusCultivo() == StatusCultivo.EM_PRODUCAO) {
            liberarArea(c.getAreaCultivo());
        }
        cultivoRepository.deleteById(id);
    }
}
