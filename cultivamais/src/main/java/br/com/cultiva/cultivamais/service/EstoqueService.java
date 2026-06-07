package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.dto.EstoqueDTO;
import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.Estoque;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.EstoqueRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EstoqueService {

    private final EstoqueRepository estoqueRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoService notificacaoService;
    private final LogService logService;

    public EstoqueService(EstoqueRepository estoqueRepository,
                          UsuarioRepository usuarioRepository,
                          NotificacaoService notificacaoService,
                          LogService logService) {
        this.estoqueRepository = estoqueRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacaoService = notificacaoService;
        this.logService = logService;
    }

    /**
     * Desconta quantidade de um insumo e notifica todos os usuários se o estoque mínimo for atingido.
     */
    @Transactional
    public void descontarInsumo(Long idEstoque, Long quantidade, String nomeExecutor, String nomeTarefa) {
        Estoque item = estoqueRepository.findById(idEstoque).orElse(null);
        if (item == null) {
            System.err.printf(">>> [Estoque] AVISO: insumo ID %d não encontrado no schema atual — desconto ignorado.%n", idEstoque);
            return;
        }

        long atual = item.getQuantidadeEstoque() != null ? item.getQuantidadeEstoque() : 0L;
        long novaQtd = Math.max(0L, atual - quantidade);
        item.setQuantidadeEstoque(novaQtd);
        estoqueRepository.saveAndFlush(item);

        logService.registrarLog(nomeExecutor,
                "Consumiu " + quantidade + " " + (item.getUnidadeMedida() != null ? item.getUnidadeMedida() : "un")
                + " de '" + item.getNome() + "' via tarefa: " + nomeTarefa);

        // Notificar todos se atingiu o estoque mínimo
        if (item.getEstoqueMinimo() != null && novaQtd <= item.getEstoqueMinimo()) {
            String unidade = item.getUnidadeMedida() != null ? item.getUnidadeMedida() : "unidades";
            String titulo = "Estoque Baixo: " + item.getNome();
            String mensagem = "Restam apenas " + novaQtd + " " + unidade
                    + " de \"" + item.getNome() + "\" no estoque. Considere reabastecer.";

            List<Usuario> todos = usuarioRepository.findAll();
            for (Usuario u : todos) {
                try {
                    notificacaoService.criarNotificacao(u.getIdUsuario(), titulo, mensagem, "alerta");
                } catch (Exception e) {
                    System.err.printf(">>> [Estoque] Falha ao notificar usuário %d: %s%n", u.getIdUsuario(), e.getMessage());
                }
            }

            logService.registrarLog("SISTEMA",
                    "Alerta de estoque mínimo para '" + item.getNome() + "': " + novaQtd + " " + unidade + " restantes.");
        }
    }

    public List<EstoqueDTO> listar() {
        return estoqueRepository.findAll().stream()
                .map(this::converterParaDTO)
                .toList();
    }

    @Transactional
    public EstoqueDTO criar(EstoqueDTO dto) {
        Estoque item = converterParaEntidade(new Estoque(), dto);
        return converterParaDTO(estoqueRepository.save(item));
    }

    @Transactional
    public EstoqueDTO atualizar(Long id, EstoqueDTO dto) {
        Estoque item = estoqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));
        converterParaEntidade(item, dto);
        return converterParaDTO(estoqueRepository.save(item));
    }

    @Transactional
    public void excluir(Long id) {
        Estoque item = estoqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));
        estoqueRepository.delete(item);
    }

    private Estoque converterParaEntidade(Estoque item, EstoqueDTO dto) {
        item.setNome(dto.getNome());
        item.setSku(dto.getSku());
        item.setCategoria(dto.getCategoria());
        item.setSubcategoria(dto.getSubcategoria());
        item.setMarca(dto.getMarca());
        item.setModelo(dto.getModelo());
        item.setFornecedor(dto.getFornecedor());
        item.setCodigoIdentificador(dto.getCodigoIdentificador());
        item.setDataAquisicao(dto.getDataAquisicao());
        item.setValorCompra(dto.getValorCompra());
        item.setUnidadeMedida(dto.getUnidadeMedida());
        item.setLocalizacao(dto.getLocalizacao());
        item.setStatus(dto.getStatus());
        item.setFotoPreview(dto.getFotoPreview());
        item.setValidade(dto.getValidade());
        item.setPrincipioAtivo(dto.getPrincipioAtivo());
        item.setEstoqueMinimo(dto.getEstoqueMinimo());
        item.setQuantidadeEstoque(dto.getQuantidadeEstoque());
        item.setHorimetroAtual(dto.getHorimetroAtual());
        item.setHorasRevisao(dto.getHorasRevisao());
        item.setTipoCombustivel(dto.getTipoCombustivel());
        item.setPlaca(dto.getPlaca());
        item.setCapacidadeTrabalho(dto.getCapacidadeTrabalho());
        item.setCompatibilidadePotencia(dto.getCompatibilidadePotencia());
        return item;
    }

    private EstoqueDTO converterParaDTO(Estoque item) {
        EstoqueDTO dto = new EstoqueDTO();
        dto.setIdEstoque(item.getIdEstoque());
        dto.setNome(item.getNome());
        dto.setSku(item.getSku());
        dto.setCategoria(item.getCategoria());
        dto.setSubcategoria(item.getSubcategoria());
        dto.setMarca(item.getMarca());
        dto.setModelo(item.getModelo());
        dto.setFornecedor(item.getFornecedor());
        dto.setCodigoIdentificador(item.getCodigoIdentificador());
        dto.setDataAquisicao(item.getDataAquisicao());
        dto.setValorCompra(item.getValorCompra());
        dto.setUnidadeMedida(item.getUnidadeMedida());
        dto.setLocalizacao(item.getLocalizacao());
        dto.setStatus(item.getStatus());
        dto.setFotoPreview(item.getFotoPreview());
        dto.setValidade(item.getValidade());
        dto.setPrincipioAtivo(item.getPrincipioAtivo());
        dto.setEstoqueMinimo(item.getEstoqueMinimo());
        dto.setQuantidadeEstoque(item.getQuantidadeEstoque());
        dto.setHorimetroAtual(item.getHorimetroAtual());
        dto.setHorasRevisao(item.getHorasRevisao());
        dto.setTipoCombustivel(item.getTipoCombustivel());
        dto.setPlaca(item.getPlaca());
        dto.setCapacidadeTrabalho(item.getCapacidadeTrabalho());
        dto.setCompatibilidadePotencia(item.getCompatibilidadePotencia());
        return dto;
    }
}
