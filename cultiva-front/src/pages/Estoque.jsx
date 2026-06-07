import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Estoque.css';
import {
    Plus, X, Image as ImageIcon, Package, Wrench, Tractor,
    Edit2, Trash2, MapPin, DollarSign, Tag, Info, ClipboardList,
    Search, SlidersHorizontal, AlertTriangle
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";
import { estoqueService } from "../services/api.js";

const CATEGORIA_CONFIG = {
    INSUMO:      { cor: '#16a34a', bg: '#f0fdf4', borda: '#bbf7d0', label: 'Insumo',      Icone: Package },
    MAQUINARIO:  { cor: '#a16207', bg: '#fef9c3', borda: '#fde047', label: 'Maquinário',  Icone: Tractor },
    EQUIPAMENTO: { cor: '#475569', bg: '#f1f5f9', borda: '#cbd5e1', label: 'Equipamento', Icone: Wrench  },
};

const STATUS_CONFIG = {
    ATIVO:      { label: 'Ativo',        bg: '#f0fdf4', cor: '#16a34a', borda: '#bbf7d0' },
    ESTOQUE:    { label: 'Em Reserva',   bg: '#eff6ff', cor: '#2563eb', borda: '#bfdbfe' },
    MANUTENCAO: { label: 'Manutenção',   bg: '#fef9c3', cor: '#a16207', borda: '#fde047' },
    BAIXADO:    { label: 'Baixado',      bg: '#fef2f2', cor: '#dc2626', borda: '#fecaca' },
};

const ESTADO_INICIAL = {
    nome: '', sku: '', categoria: 'INSUMO', subcategoria: '',
    marca: '', modelo: '', fornecedor: '', codigoIdentificador: '',
    dataAquisicao: '', valorCompra: '', unidadeMedida: 'UNIDADE',
    localizacao: '', status: 'ATIVO', fotoPreview: null,
    validade: '', principioAtivo: '', estoqueMinimo: '', quantidadeEstoque: '',
    horimetroAtual: '', horasRevisao: '', tipoCombustivel: 'DIESEL', placa: '',
    capacidadeTrabalho: '', compatibilidadePotencia: ''
};

const obterSubcategorias = (categoria) => {
    switch (categoria) {
        case 'INSUMO':      return ['Herbicida', 'Fertilizante/Adubo', 'Semente', 'Combustível', 'Defensivo Químico'];
        case 'MAQUINARIO':  return ['Trator', 'Colhedora', 'Pulverizador Autopropelido', 'Caminhão', 'Quadriciclo'];
        case 'EQUIPAMENTO': return ['Arado/Grade', 'Plantadeira', 'Roçadeira', 'Sistema de Irrigação', 'Carreta Agrícola'];
        default: return [];
    }
};

const Estoque = () => {
    const notify = useNotify();

    const [itens, setItens] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [modalDetalhes, setModalDetalhes] = useState(false);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [editandoId, setEditandoId] = useState(null);
    const [itemForm, setItemForm] = useState(ESTADO_INICIAL);
    const [filtros, setFiltros] = useState({ nome: '', categoria: '', subcategoria: '' });
    const [modalConfirmacao, setModalConfirmacao] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);

    const setFiltro = (campo) => (e) => setFiltros(f => ({ ...f, [campo]: e.target.value, ...(campo === 'categoria' ? { subcategoria: '' } : {}) }));
    const limparFiltros = () => setFiltros({ nome: '', categoria: '', subcategoria: '' });
    const filtrosAtivos = filtros.nome || filtros.categoria || filtros.subcategoria;

    const itensFiltrados = itens.filter(item => {
        const matchNome = !filtros.nome || item.nome.toLowerCase().includes(filtros.nome.toLowerCase());
        const matchCategoria = !filtros.categoria || item.categoria === filtros.categoria;
        const matchSubcategoria = !filtros.subcategoria || (item.subcategoria || '').toUpperCase() === filtros.subcategoria.toUpperCase();
        return matchNome && matchCategoria && matchSubcategoria;
    });

    useEffect(() => { carregarItens(); }, []);

    const carregarItens = async () => {
        try {
            const data = await estoqueService.listar();
            setItens(data);
        } catch (err) {
            notify("Erro ao carregar estoque.", "error");
        }
    };

    const abrirModal = (item = null, e) => {
        if (e) e.stopPropagation();
        if (item) {
            setEditandoId(item.idEstoque);
            setItemForm({
                ...ESTADO_INICIAL,
                ...item,
                valorCompra: item.valorCompra ?? '',
                estoqueMinimo: item.estoqueMinimo ?? '',
                quantidadeEstoque: item.quantidadeEstoque ?? '',
                horimetroAtual: item.horimetroAtual ?? '',
                horasRevisao: item.horasRevisao ?? '',
            });
        } else {
            setEditandoId(null);
            setItemForm(ESTADO_INICIAL);
        }
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditandoId(null);
        setItemForm(ESTADO_INICIAL);
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setItemForm(f => ({ ...f, fotoPreview: reader.result }));
        reader.readAsDataURL(file);
    };

    const set = (campo) => (e) => setItemForm(f => ({ ...f, [campo]: e.target.value }));

    const salvarItem = async (e) => {
        e.preventDefault();
        if (carregando) return;
        setCarregando(true);
        try {
            const payload = {
                ...itemForm,
                valorCompra: itemForm.valorCompra !== '' ? parseFloat(itemForm.valorCompra) : null,
                estoqueMinimo: itemForm.estoqueMinimo !== '' ? parseInt(itemForm.estoqueMinimo) : null,
                quantidadeEstoque: itemForm.quantidadeEstoque !== '' ? parseInt(itemForm.quantidadeEstoque) : null,
                horimetroAtual: itemForm.horimetroAtual !== '' ? parseFloat(itemForm.horimetroAtual) : null,
            };
            if (editandoId) {
                await estoqueService.atualizar(editandoId, payload);
                notify("Item atualizado!", "success");
            } else {
                await estoqueService.criar(payload);
                notify("Item cadastrado!", "success");
            }
            await carregarItens();
            fecharModal();
        } catch (err) {
            notify(err.message || "Erro ao salvar item.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const excluirItem = (id, e) => {
        e.stopPropagation();
        const item = itens.find(i => i.idEstoque === id);
        setItemParaExcluir(item);
        setModalConfirmacao(true);
    };

    const confirmarExclusao = async () => {
        if (!itemParaExcluir) return;
        try {
            await estoqueService.excluir(itemParaExcluir.idEstoque);
            notify("Item removido.", "success");
            await carregarItens();
            if (itemSelecionado?.idEstoque === itemParaExcluir.idEstoque) setModalDetalhes(false);
        } catch (err) {
            notify("Erro ao excluir item.", "error");
        } finally {
            setModalConfirmacao(false);
            setItemParaExcluir(null);
        }
    };

    const abrirDetalhes = (item) => {
        setItemSelecionado(item);
        setModalDetalhes(true);
    };

    const renderItem = (item) => {
        const cfg = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.INSUMO;
        const { Icone } = cfg;
        const stCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ATIVO;
        const estoqueAlerta = item.categoria === 'INSUMO' &&
            item.estoqueMinimo != null && item.quantidadeEstoque != null &&
            item.quantidadeEstoque <= item.estoqueMinimo;

        return (
            <div key={item.idEstoque} className="task-item estoque-card" onClick={() => abrirDetalhes(item)}>
                <div className="task-status-indicator" style={{ background: cfg.cor }} />

                <div className="estoque-thumb" style={{ background: cfg.bg, border: `1px solid ${cfg.borda}` }}>
                    {item.fotoPreview
                        ? <img src={item.fotoPreview} alt={item.nome} />
                        : <Icone size={28} color={cfg.cor} />}
                </div>

                <div className="task-content">
                    <div className="task-main-info">
                        <h4 className="task-title">{item.nome}</h4>
                        <span className="priority-badge" style={{ background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}` }}>
                            {cfg.label}
                        </span>
                        {estoqueAlerta && (
                            <span className="priority-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                Estoque Baixo
                            </span>
                        )}
                    </div>

                    {(item.subcategoria || item.marca || item.modelo) && (
                        <p className="task-desc" style={{ marginBottom: '6px' }}>
                            {[item.subcategoria, item.marca, item.modelo].filter(Boolean).join(' • ')}
                        </p>
                    )}

                    <div className="task-meta">
                        {item.categoria === 'INSUMO' && item.quantidadeEstoque != null && (
                            <span className="meta-tag">
                                <Package size={12} />
                                {item.quantidadeEstoque} {item.unidadeMedida || 'un'}
                            </span>
                        )}
                        {item.categoria === 'MAQUINARIO' && item.horimetroAtual != null && (
                            <span className="meta-tag">
                                <Info size={12} />
                                {item.horimetroAtual}h horímetro
                            </span>
                        )}
                        {item.localizacao && (
                            <span className="meta-tag"><MapPin size={12} /> {item.localizacao}</span>
                        )}
                        {item.valorCompra != null && (
                            <span className="meta-tag">
                                <DollarSign size={12} />
                                R$ {Number(item.valorCompra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        )}
                        {item.status && (
                            <span className="meta-tag" style={{ background: stCfg.bg, color: stCfg.cor, border: `1px solid ${stCfg.borda}` }}>
                                {stCfg.label}
                            </span>
                        )}
                    </div>
                </div>

                <div className="task-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon-sm" title="Editar" onClick={(e) => abrirModal(item, e)}>
                        <Edit2 size={16} />
                    </button>
                    <button className="btn-icon-sm danger" title="Excluir" onClick={(e) => excluirItem(item.idEstoque, e)}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDetalhesCampo = (label, valor) => {
        if (!valor && valor !== 0) return null;
        return (
            <div className="detalhe-campo">
                <span className="detalhe-label">{label}</span>
                <span className="detalhe-valor">{valor}</span>
            </div>
        );
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Centro de Estoque</h1>
                    <p className="dashboard-subtitle">Lance aqui os itens do estoque da fazenda.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Novo Item
                </button>
            </div>

            {/* ─── BARRA DE FILTROS ─── */}
            <div className="estoque-filtros">
                <div className="filtro-busca">
                    <Search size={16} className="filtro-busca-icone" />
                    <input
                        className="filtro-input"
                        placeholder="Buscar por nome do item..."
                        value={filtros.nome}
                        onChange={setFiltro('nome')}
                    />
                </div>

                <select className="filtro-select" value={filtros.categoria} onChange={setFiltro('categoria')}>
                    <option value="">Todas as categorias</option>
                    <option value="INSUMO">Insumos</option>
                    <option value="MAQUINARIO">Maquinários</option>
                    <option value="EQUIPAMENTO">Equipamentos</option>
                </select>

                <select className="filtro-select" value={filtros.subcategoria} onChange={setFiltro('subcategoria')} disabled={!filtros.categoria}>
                    <option value="">Todas as subcategorias</option>
                    {obterSubcategorias(filtros.categoria).map((sub, i) => (
                        <option key={i} value={sub.toUpperCase()}>{sub}</option>
                    ))}
                </select>

                {filtrosAtivos && (
                    <button className="filtro-limpar" onClick={limparFiltros}>
                        <X size={14} /> Limpar
                    </button>
                )}

                <span className="filtro-contador">
                    {itensFiltrados.length} de {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                </span>
            </div>

            <div className="task-list-container">
                {itens.length === 0 ? (
                    <div className="empty-state-tasks">
                        <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#64748b' }}>Estoque vazio</h3>
                        <p style={{ color: '#94a3b8' }}>Cadastre o primeiro item do estoque da fazenda.</p>
                    </div>
                ) : itensFiltrados.length === 0 ? (
                    <div className="empty-state-tasks">
                        <Search size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#64748b' }}>Nenhum resultado</h3>
                        <p style={{ color: '#94a3b8' }}>Nenhum item corresponde aos filtros aplicados.</p>
                        <button className="filtro-limpar" style={{ marginTop: '12px' }} onClick={limparFiltros}>
                            <X size={14} /> Limpar filtros
                        </button>
                    </div>
                ) : (
                    itensFiltrados.map(renderItem)
                )}
            </div>

            {/* ═══ MODAL CRIAR / EDITAR ═══ */}
            {modalAberto && (
                <div className="modal-modern-overlay-estoque">
                    <div className="modal-modern-content-estoque" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header-premium-estoque">
                            <h2>{editandoId ? 'Ajustar Detalhes do Item' : 'Novo Item Agro'}</h2>
                            <button className="btn-close-modal-estoque" onClick={fecharModal}><X size={20} /></button>
                        </div>

                        <form onSubmit={salvarItem} className="form-premium-estoque">

                            {/* LINHA TOPO: foto + campos principais */}
                            <div className="form-row-estoque" style={{ display: 'flex', flexDirection: 'row', gap: '15px', alignItems: 'flex-start' }}>

                                {/* Foto */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1', minWidth: '220px' }}>
                                    <label className="input-label" style={{ textAlign: 'center' }}>Foto do Item</label>
                                    <div style={{ width: '180px', height: '180px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                        {itemForm.fotoPreview
                                            ? <img src={itemForm.fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <ImageIcon size={32} style={{ color: '#94a3b8' }} />}
                                    </div>
                                    <input type="file" accept="image/*" id="upload-foto" onChange={handleFotoChange} style={{ display: 'none' }} />
                                    <label htmlFor="upload-foto" className="link-action-estoque" style={{ fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
                                        Selecionar Imagem
                                    </label>
                                    {itemForm.fotoPreview && (
                                        <button type="button" className="link-action-estoque" style={{ fontSize: '0.8rem', color: '#ef4444' }}
                                            onClick={() => setItemForm(f => ({ ...f, fotoPreview: null }))}>
                                            Remover foto
                                        </button>
                                    )}
                                </div>

                                {/* Campos principais */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="form-group-estoque">
                                        <label className="input-label">Nome do Item *</label>
                                        <input className="login-input" placeholder="Ex: Trator John Deere 6115J ou Adubo NPK" value={itemForm.nome} onChange={set('nome')} required />
                                    </div>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Categoria *</label>
                                            <select className="login-input" value={itemForm.categoria} onChange={e => setItemForm(f => ({ ...f, categoria: e.target.value, subcategoria: '' }))}>
                                                <option value="INSUMO">Insumos (Consumíveis)</option>
                                                <option value="MAQUINARIO">Maquinários</option>
                                                <option value="EQUIPAMENTO">Equipamentos e Implementos</option>
                                            </select>
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Subcategoria *</label>
                                            <select className="login-input" value={itemForm.subcategoria} onChange={set('subcategoria')} required>
                                                <option value="">Selecione...</option>
                                                {obterSubcategorias(itemForm.categoria).map((sub, i) => (
                                                    <option key={i} value={sub.toUpperCase()}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Marca / Fabricante</label>
                                            <input className="login-input" placeholder="Ex: Massey Ferguson" value={itemForm.marca} onChange={set('marca')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Modelo</label>
                                            <input className="login-input" placeholder="Ex: 4707 Cabinado" value={itemForm.modelo} onChange={set('modelo')} />
                                        </div>
                                    </div>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Código de Barras / SKU</label>
                                            <input className="login-input" placeholder="Bipe ou digite o código" value={itemForm.sku} onChange={set('sku')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">
                                                {itemForm.categoria === 'INSUMO' ? 'Nº do Lote' : itemForm.categoria === 'MAQUINARIO' ? 'Chassi / Nº Série' : 'Nº de Série'}
                                            </label>
                                            <input className="login-input" placeholder="Identificador físico" value={itemForm.codigoIdentificador} onChange={set('codigoIdentificador')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LINHA 2: Data, Valor, Localização, Status */}
                            <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                <div className="form-group-estoque">
                                    <label className="input-label">Data de Aquisição</label>
                                    <input type="date" className="login-input" value={itemForm.dataAquisicao} onChange={set('dataAquisicao')} />
                                </div>
                                <div className="form-group-estoque">
                                    <label className="input-label">Valor de Compra (R$)</label>
                                    <input type="number" step="0.01" className="login-input" placeholder="0,00" value={itemForm.valorCompra} onChange={set('valorCompra')} />
                                </div>
                                <div className="form-group-estoque">
                                    <label className="input-label">Localização</label>
                                    <input className="login-input" placeholder="Ex: Galpão A, Prateleira 02" value={itemForm.localizacao} onChange={set('localizacao')} />
                                </div>
                                <div className="form-group-estoque">
                                    <label className="input-label">Status do Ativo</label>
                                    <select className="login-input" value={itemForm.status} onChange={set('status')}>
                                        <option value="ATIVO">Ativo / Disponível</option>
                                        <option value="ESTOQUE">Em Estoque (Reserva)</option>
                                        <option value="MANUTENCAO">Em Manutenção</option>
                                        <option value="BAIXADO">Baixado / Esgotado</option>
                                    </select>
                                </div>
                            </div>

                            {/* CAMPOS DINÂMICOS: INSUMOS */}
                            {itemForm.categoria === 'INSUMO' && (
                                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#16a34a', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Detalhes do Insumo</h4>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Qtd. em Estoque</label>
                                            <input type="number" className="login-input" placeholder="0" value={itemForm.quantidadeEstoque} onChange={set('quantidadeEstoque')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Unidade de Medida</label>
                                            <select className="login-input" value={itemForm.unidadeMedida} onChange={set('unidadeMedida')}>
                                                <option value="UNIDADE">Unidade (un)</option>
                                                <option value="LITRO">Litros (L)</option>
                                                <option value="KG">Quilos (KG)</option>
                                                <option value="SACA">Sacas (sc)</option>
                                                <option value="TONELADA">Toneladas (t)</option>
                                            </select>
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Estoque Mínimo</label>
                                            <input type="number" className="login-input" placeholder="Alerta de reposição" value={itemForm.estoqueMinimo} onChange={set('estoqueMinimo')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Data de Validade</label>
                                            <input type="date" className="login-input" value={itemForm.validade} onChange={set('validade')} />
                                        </div>
                                    </div>
                                    <div className="form-group-estoque" style={{ marginTop: '10px' }}>
                                        <label className="input-label">Princípio Ativo / Composição</label>
                                        <input className="login-input" placeholder="Ex: Glifosato, Cloridrato de..." value={itemForm.principioAtivo} onChange={set('principioAtivo')} />
                                    </div>
                                </div>
                            )}

                            {/* CAMPOS DINÂMICOS: MAQUINÁRIOS */}
                            {itemForm.categoria === 'MAQUINARIO' && (
                                <div style={{ background: '#fef9c3', padding: '15px', borderRadius: '12px', border: '1px solid #fde047' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#a16207', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Detalhes do Maquinário</h4>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Horímetro Inicial (h)</label>
                                            <input type="number" className="login-input" placeholder="Ex: 1500" value={itemForm.horimetroAtual} onChange={set('horimetroAtual')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Horas p/ Próx. Revisão</label>
                                            <input type="number" className="login-input" placeholder="Ex: 250" value={itemForm.horasRevisao} onChange={set('horasRevisao')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Tipo de Combustível</label>
                                            <select className="login-input" value={itemForm.tipoCombustivel} onChange={set('tipoCombustivel')}>
                                                <option value="DIESEL">Diesel</option>
                                                <option value="BIODIESEL">Biodiesel</option>
                                                <option value="GASOLINA">Gasolina</option>
                                                <option value="ETANOL">Etanol</option>
                                            </select>
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Placa</label>
                                            <input className="login-input" placeholder="ABC1D23" value={itemForm.placa} onChange={set('placa')} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CAMPOS DINÂMICOS: EQUIPAMENTOS */}
                            {itemForm.categoria === 'EQUIPAMENTO' && (
                                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Detalhes do Equipamento</h4>
                                    <div className="form-row-estoque" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Capacidade de Carga/Trabalho</label>
                                            <input className="login-input" placeholder="Ex: 12 linhas / 2000L" value={itemForm.capacidadeTrabalho} onChange={set('capacidadeTrabalho')} />
                                        </div>
                                        <div className="form-group-estoque">
                                            <label className="input-label">Compatibilidade de Potência</label>
                                            <input className="login-input" placeholder="Ex: Tratores > 90 CV" value={itemForm.compatibilidadePotencia} onChange={set('compatibilidadePotencia')} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group-estoque">
                                <label className="input-label">Fornecedor Associado</label>
                                <input className="login-input" placeholder="Nome da empresa ou distribuidor" value={itemForm.fornecedor} onChange={set('fornecedor')} />
                            </div>

                            <div className="modal-footer-estoque">
                                <button type="button" onClick={fecharModal} className="link-action-estoque" style={{ color: '#64748b' }}>
                                    Descartar
                                </button>
                                <button type="submit" className="btn-login-estoque" style={{ marginTop: 0, padding: '10px 30px' }} disabled={carregando}>
                                    {carregando ? 'Sincronizando...' : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ MODAL DETALHES DO ITEM ═══ */}
            {modalDetalhes && itemSelecionado && (() => {
                const item = itemSelecionado;
                const cfg = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.INSUMO;
                const { Icone } = cfg;
                const stCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ATIVO;
                return (
                    <div className="modal-modern-overlay-estoque" onClick={() => setModalDetalhes(false)}>
                        <div className="modal-detalhe-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-premium-estoque">
                                <h2>Detalhes do Item</h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon-sm" title="Editar" onClick={(e) => { setModalDetalhes(false); abrirModal(item, e); }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-close-modal-estoque" onClick={() => setModalDetalhes(false)}><X size={20} /></button>
                                </div>
                            </div>

                            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(85vh - 80px)' }}>
                                {/* Topo: foto + info principal */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '140px', height: '140px', borderRadius: '16px', background: cfg.bg, border: `2px solid ${cfg.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                        {item.fotoPreview
                                            ? <img src={item.fotoPreview} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Icone size={48} color={cfg.cor} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>{item.nome}</h3>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                            <span className="priority-badge" style={{ background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}`, fontSize: '0.75rem', padding: '4px 12px' }}>{cfg.label}</span>
                                            {item.subcategoria && <span className="priority-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.75rem', padding: '4px 12px' }}>{item.subcategoria}</span>}
                                            <span className="priority-badge" style={{ background: stCfg.bg, color: stCfg.cor, border: `1px solid ${stCfg.borda}`, fontSize: '0.75rem', padding: '4px 12px' }}>{stCfg.label}</span>
                                        </div>
                                        {item.marca && <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '0.9rem' }}><strong>Marca:</strong> {item.marca}</p>}
                                        {item.modelo && <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '0.9rem' }}><strong>Modelo:</strong> {item.modelo}</p>}
                                        {item.fornecedor && <p style={{ color: '#64748b', margin: '0', fontSize: '0.9rem' }}><strong>Fornecedor:</strong> {item.fornecedor}</p>}
                                    </div>
                                </div>

                                {/* Informações Gerais */}
                                <div className="detalhe-secao">
                                    <h4 className="detalhe-secao-titulo">Informações Gerais</h4>
                                    <div className="detalhe-grid">
                                        {renderDetalhesCampo('SKU / Código de Barras', item.sku)}
                                        {renderDetalhesCampo('Código Identificador', item.codigoIdentificador)}
                                        {renderDetalhesCampo('Data de Aquisição', item.dataAquisicao)}
                                        {renderDetalhesCampo('Valor de Compra', item.valorCompra != null ? `R$ ${Number(item.valorCompra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null)}
                                        {renderDetalhesCampo('Localização', item.localizacao)}
                                    </div>
                                </div>

                                {/* Insumos */}
                                {item.categoria === 'INSUMO' && (
                                    <div className="detalhe-secao" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <h4 className="detalhe-secao-titulo" style={{ color: '#16a34a' }}>Detalhes do Insumo</h4>
                                        <div className="detalhe-grid">
                                            {renderDetalhesCampo('Quantidade em Estoque', item.quantidadeEstoque != null ? `${item.quantidadeEstoque} ${item.unidadeMedida || 'un'}` : null)}
                                            {renderDetalhesCampo('Estoque Mínimo', item.estoqueMinimo != null ? `${item.estoqueMinimo} ${item.unidadeMedida || 'un'}` : null)}
                                            {renderDetalhesCampo('Data de Validade', item.validade)}
                                            {renderDetalhesCampo('Princípio Ativo', item.principioAtivo)}
                                        </div>
                                    </div>
                                )}

                                {/* Maquinários */}
                                {item.categoria === 'MAQUINARIO' && (
                                    <div className="detalhe-secao" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                                        <h4 className="detalhe-secao-titulo" style={{ color: '#a16207' }}>Detalhes do Maquinário</h4>
                                        <div className="detalhe-grid">
                                            {renderDetalhesCampo('Horímetro Atual', item.horimetroAtual != null ? `${item.horimetroAtual}h` : null)}
                                            {renderDetalhesCampo('Horas p/ Próxima Revisão', item.horasRevisao ? `${item.horasRevisao}h` : null)}
                                            {renderDetalhesCampo('Tipo de Combustível', item.tipoCombustivel)}
                                            {renderDetalhesCampo('Placa', item.placa)}
                                        </div>
                                    </div>
                                )}

                                {/* Equipamentos */}
                                {item.categoria === 'EQUIPAMENTO' && (
                                    <div className="detalhe-secao" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                                        <h4 className="detalhe-secao-titulo" style={{ color: '#475569' }}>Detalhes do Equipamento</h4>
                                        <div className="detalhe-grid">
                                            {renderDetalhesCampo('Capacidade de Trabalho', item.capacidadeTrabalho)}
                                            {renderDetalhesCampo('Compatibilidade de Potência', item.compatibilidadePotencia)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer-estoque">
                                <button type="button" className="btn-icon-sm danger" style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                    onClick={(e) => excluirItem(item.idEstoque, e)}>
                                    <Trash2 size={15} /> Excluir Item
                                </button>
                                <button type="button" className="btn-login-estoque" style={{ marginTop: 0, padding: '10px 24px' }}
                                    onClick={(e) => { setModalDetalhes(false); abrirModal(item, e); }}>
                                    <Edit2 size={16} /> Editar Item
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ═══ MODAL CONFIRMAÇÃO DE EXCLUSÃO ═══ */}
            {modalConfirmacao && itemParaExcluir && (
                <div className="modal-modern-overlay-estoque" onClick={() => { setModalConfirmacao(false); setItemParaExcluir(null); }}>
                    <div className="modal-confirmacao" onClick={e => e.stopPropagation()}>
                        <div className="modal-confirmacao-icone">
                            <AlertTriangle size={28} color="#dc2626" />
                        </div>
                        <h3 className="modal-confirmacao-titulo">Excluir item?</h3>
                        <p className="modal-confirmacao-descricao">
                            Você está prestes a excluir permanentemente:
                        </p>
                        <div className="modal-confirmacao-item">
                            {itemParaExcluir.fotoPreview
                                ? <img src={itemParaExcluir.fotoPreview} alt={itemParaExcluir.nome} className="modal-confirmacao-thumb" />
                                : (() => {
                                    const cfg = CATEGORIA_CONFIG[itemParaExcluir.categoria] || CATEGORIA_CONFIG.INSUMO;
                                    const { Icone } = cfg;
                                    return <div className="modal-confirmacao-thumb" style={{ background: cfg.bg, border: `1px solid ${cfg.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icone size={22} color={cfg.cor} /></div>;
                                })()
                            }
                            <div>
                                <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{itemParaExcluir.nome}</strong>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                    {(CATEGORIA_CONFIG[itemParaExcluir.categoria] || {}).label} {itemParaExcluir.subcategoria ? `• ${itemParaExcluir.subcategoria}` : ''}
                                </p>
                            </div>
                        </div>
                        <p className="modal-confirmacao-aviso">Esta ação não pode ser desfeita.</p>
                        <div className="modal-confirmacao-acoes">
                            <button className="modal-confirmacao-btn-cancelar" onClick={() => { setModalConfirmacao(false); setItemParaExcluir(null); }}>
                                Cancelar
                            </button>
                            <button className="modal-confirmacao-btn-excluir" onClick={confirmarExclusao}>
                                <Trash2 size={15} /> Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estoque;
