import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Plantas.css';
import {
    Trash2, Plus, Sprout, Clock, Pencil,
    Leaf, Cherry, Bean, Wheat, X, Microscope,
    Droplets, Sun, Flower, AlertCircle, LeafyGreen
} from 'lucide-react';
import { plantaService, userService, authService } from "../services/api.js";
import { useNotify } from "../context/NotificationContext";

const Plantas = () => {
    const notify = useNotify();

    // --- ESTADOS ---
    const [plantas, setPlantas] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null, nome: '' });
    const [carregando, setCarregando] = useState(false);

    const [editandoId, setEditandoId] = useState(null);
    const [novaPlanta, setNovaPlanta] = useState({
        nomePopular: '',
        nomeCientifico: '',
        tipoPlanta: 'HORTALICA',
        cicloMedioDias: '',
        solosRecomendados: [],
        aguaRecomendada: 'MEDIA',
        luzRecomendada: 'MEIA_SOMBRA',
        descricaoPlanta: ''
    });

    const CATEGORIAS_SOLO = {
        "Textura e Composição": ["ARGILOSO", "ARENOSO", "SILTOSO", "HUMOSO", "CALCARIO", "FRANCO"],
        "Classificação Técnica (Embrapa)": ["LATOSSOLO", "ARGISSOLO", "CHERNOSSOLO", "NEOSSOLO", "CAMBISSOLO", "GLEISSOLO", "NITOSSOLO"],
        "Tipos Regionais / Outros": ["TERRA_ROXA", "MASSAPE", "VARZEA", "MISTO", "OUTRO"]
    };

    const getPlantConfig = (tipo) => {
        switch (tipo) {
            case 'FRUTA':
                return { icon: Cherry, colorClass: 'bg-soft-orange', borderClass: 'border-top-fruta', badgeStyle: { bg: '#ffedd5', color: '#c2410c' } };
            case 'GRAO':
                return { icon: Wheat, colorClass: 'bg-soft-yellow', borderClass: 'border-top-grao', badgeStyle: { bg: '#fefce8', color: '#ca8a04' } };
            case 'LEGUME':
                return { icon: Bean, colorClass: 'bg-soft-purple', borderClass: 'border-top-legume', badgeStyle: { bg: '#faf5ff', color: '#9333ea' } };
            case 'FLOR':
                return { icon: Flower, colorClass: 'bg-soft-pink', borderClass: 'border-top-flor', badgeStyle: { bg: '#fdf2f8', color: '#db2777' } };
            case 'TEMPERO':
                return { icon: LeafyGreen, colorClass: 'bg-soft-yellow', borderClass: 'border-top-hortalica', badgeStyle: { bg: '#ecfdf5', color: '#059669' } };
            case 'ERVA_MEDICINAL':
                return { icon: Microscope, colorClass: 'bg-soft-green', borderClass: 'border-top-hortalica', badgeStyle: { bg: '#f0fdf4', color: '#16a34a' } };
            default:
                return { icon: Leaf, colorClass: 'bg-soft-green', borderClass: 'border-top-hortalica', badgeStyle: { bg: '#f0fdf4', color: '#16a34a' } };
        }
    };

    const carregarPlantas = async () => {
        try {
            const dados = await plantaService.listar();
            setPlantas(Array.isArray(dados) ? dados : []);
        } catch (err) {
            notify("Erro ao conectar com o catálogo.", "error");
        }
    };

    useEffect(() => { carregarPlantas(); }, []);

    const abrirModal = (planta = null) => {
        if (planta) {
            setEditandoId(planta.idPlanta);
            setNovaPlanta({ ...planta });
        } else {
            setEditandoId(null);
            setNovaPlanta({
                nomePopular: '', nomeCientifico: '', tipoPlanta: 'HORTALICA',
                cicloMedioDias: '', solosRecomendados: [], aguaRecomendada: 'MEDIA', luzRecomendada: 'MEIA_SOMBRA'
            });
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); };

    const toggleSolo = (solo) => {
        setNovaPlanta(prev => {
            const solosAtuais = prev.solosRecomendados || [];
            return solosAtuais.includes(solo)
                ? { ...prev, solosRecomendados: solosAtuais.filter(s => s !== solo) }
                : { ...prev, solosRecomendados: [...solosAtuais, solo] };
        });
    };

    const abrirConfirmacaoExclusao = (id, nome) => {
        setConfirmacaoExclusao({ aberta: true, id, nome });
    };

    const executarExclusao = async () => {
        const usuarioLogado = authService.obterUsuarioLogado();
        const idUsuario = usuarioLogado?.idUsuario || usuarioLogado?.id;

        try {
            await plantaService.excluir(confirmacaoExclusao.id);

            await userService.registrarLog(
                "Exclusão de Catálogo",
                `Removeu a espécie ${confirmacaoExclusao.nome} do sistema`,
                idUsuario
            );

            notify(`Planta removida.`, "success");
            carregarPlantas();
            setConfirmacaoExclusao({ aberta: false });
        } catch (err) {
            notify("Erro ao excluir planta. Verifique se ela está sendo usada em algum cultivo.", "error");
        }
    };

    const salvarPlanta = async (e) => {
        e.preventDefault();
        if (carregando) return;

        setCarregando(true);
        const usuarioLogado = authService.obterUsuarioLogado();
        const idUsuario = usuarioLogado?.idUsuario || usuarioLogado?.id;

        try {
            const dadosFormatados = {
                ...novaPlanta,
                cicloMedioDias: Number(novaPlanta.cicloMedioDias)
            };

            if (editandoId) {
                await plantaService.atualizar(editandoId, dadosFormatados);

                await userService.registrarLog(
                    "Edição de Catálogo",
                    `Atualizou os dados da espécie: ${novaPlanta.nomePopular}`,
                    idUsuario
                );
            } else {
                await plantaService.criar(dadosFormatados);

                await userService.registrarLog(
                    "Novo Registro no Catálogo",
                    `Adicionou a espécie ${novaPlanta.nomePopular} ao banco fitotécnico`,
                    idUsuario
                );
            }

            notify("Dados salvos com sucesso!", "success");
            await carregarPlantas();
            fecharModal();
        } catch (err) {
            notify(err.message || "Erro ao salvar planta.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const mediaCiclo = plantas.length > 0 ? Math.round(plantas.reduce((acc, p) => acc + (Number(p.cicloMedioDias) || 0), 0) / plantas.length) : 0;
    const formatarTexto = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase().replace(/_/g, ' ') : '';

    return (
        <div className="main-content animate-fade-in">
            {/* HEADER */}
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Catálogo de Espécies</h1>
                    <p className="dashboard-subtitle">Base de conhecimento fitotécnico para cultivos.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Nova Espécie
                </button>
            </div>

            {/* KPI STATS */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Espécies Catalogadas</span>
                        <div className="icon-box bg-green-light"><Sprout size={20} /></div>
                    </div>
                    <div className="kpi-value">{plantas.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-title">Média de Colheita</span>
                        <div className="icon-box bg-orange-light"><Clock size={20} /></div>
                    </div>
                    <div className="kpi-value">{mediaCiclo} <small>dias</small></div>
                </div>
            </div>

            {/* GRID DE PLANTAS */}
            <div className="plants-grid">
                {plantas.map(planta => {
                    const config = getPlantConfig(planta.tipoPlanta);
                    const PlantIcon = config.icon;

                    return (
                        <div key={planta.idPlanta} className="plant-card">
                            <div className={`plant-card-top ${config.borderClass}`}></div>

                            <div className="plant-card-content">
                                {/* CABEÇALHO DO CARD - Trava o ícone e o badge no topo */}
                                <div className="plant-card-header">
                                    <div className={`plant-icon-wrapper ${config.colorClass}`}>
                                        <PlantIcon size={22} />
                                    </div>
                                    <span className="plant-badge" style={{ backgroundColor: config.badgeStyle.bg, color: config.badgeStyle.color }}>
                                        {formatarTexto(planta.tipoPlanta)}
                                    </span>
                                </div>

                                <h3 className="plant-name">{planta.nomePopular}</h3>
                                <p className="plant-scientific">{planta.nomeCientifico || 'Espécie não identificada'}</p>

                                <div className="plant-info-section">
                                    <div className="cycle-info">
                                        <Clock size={16} className="text-muted" />
                                        <span>Ciclo Médio: <strong>{planta.cicloMedioDias} dias</strong></span>
                                    </div>

                                    <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                                        <span className="soil-tag"><Sun size={12} style={{marginRight: 4}}/> {formatarTexto(planta.luzRecomendada)}</span>
                                        <span className="soil-tag"><Droplets size={12} style={{marginRight: 4}}/> {formatarTexto(planta.aguaRecomendada)}</span>
                                    </div>

                                    <div className="soil-label">Solos Recomendados</div>
                                    <div className="soil-tags-container">
                                        {planta.solosRecomendados?.length > 0 ? planta.solosRecomendados.map(s => (
                                            <span key={s} className="soil-tag">{formatarTexto(s)}</span>
                                        )) : <span className="text-muted" style={{fontSize: '0.8rem'}}>Geral</span>}
                                    </div>
                                </div>
                            </div>

                            {/* RODAPÉ */}
                            <div className="user-actions-footer">
                                <button className="btn-outline-sm" onClick={() => abrirModal(planta)}>
                                    <Pencil size={16} style={{marginRight: 8}}/> Editar
                                </button>
                                
                                <button
                                    className="btn-delete-planta"
                                    onClick={() => abrirConfirmacaoExclusao(planta.idPlanta, planta.nomePopular)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL EXCLUSÃO */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content confirm-modal" style={{maxWidth: '400px'}}>
                        <div className="icon-warning-container"><AlertCircle size={40} /></div>
                        <h3 className="modal-title">Excluir Espécie?</h3>
                        <p style={{ color: '#64748b', margin: '15px 0' }}>Remover <strong>{confirmacaoExclusao.nome}</strong> do catálogo?</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoExclusao({ aberta: false })}>Cancelar</button>
                            <button className="btn-danger" onClick={executarExclusao}>Remover</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORMULÁRIO */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth: '650px', padding: '1.5rem'}}>
                        <div className="modal-header-flex" style={{padding: '0 0 10px 0', marginBottom: '10px'}}>
                            <h2 className="modal-title" style={{fontSize: '1.25rem'}}>{editandoId ? 'Atualizar Dados' : 'Nova Planta'}</h2>
                            <button className="btn-close-modal" onClick={fecharModal}><X size={20} /></button>
                        </div>

                        <form onSubmit={salvarPlanta}>
                            <div className="form-compact-grid">
                                <div className="form-group">
                                    <label className="form-label">Nome Popular</label>
                                    <input className="form-input" value={novaPlanta.nomePopular} onChange={e => setNovaPlanta({...novaPlanta, nomePopular: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nome Científico</label>
                                    <input className="form-input" style={{fontStyle: 'italic'}} value={novaPlanta.nomeCientifico} onChange={e => setNovaPlanta({...novaPlanta, nomeCientifico: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ciclo Médio (dias)</label>
                                    <input type="number" className="form-input" value={novaPlanta.cicloMedioDias} onChange={e => setNovaPlanta({...novaPlanta, cicloMedioDias: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo de Cultura</label>
                                    <select className="form-select" value={novaPlanta.tipoPlanta} onChange={e => setNovaPlanta({...novaPlanta, tipoPlanta: e.target.value})}>
                                        <option value="HORTALICA">Hortaliça</option>
                                        <option value="FRUTA">Fruta</option>
                                        <option value="GRAO">Grão</option>
                                        <option value="LEGUME">Legume</option>
                                        <option value="TEMPERO">Tempero</option>
                                        <option value="FLOR">Flor</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Necessidade Hídrica</label>
                                    <select className="form-select" value={novaPlanta.aguaRecomendada} onChange={e => setNovaPlanta({...novaPlanta, aguaRecomendada: e.target.value})}>
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Luz Recomendada</label>
                                    <select className="form-select" value={novaPlanta.luzRecomendada} onChange={e => setNovaPlanta({...novaPlanta, luzRecomendada: e.target.value})}>
                                        <option value="SOMBRA">Sombra</option>
                                        <option value="MEIA_SOMBRA">Meia Sombra</option>
                                        <option value="PLENO_SOL">Pleno Sol</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{marginTop: '5px'}}>
                                <label className="form-label">Solos Ideais para Cultivo</label>
                                <div style={{maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', background: '#f8fafc'}}>
                                    {Object.entries(CATEGORIAS_SOLO).map(([cat, solos]) => (
                                        <div key={cat} style={{marginBottom: '10px'}}>
                                            <div style={{fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px', borderBottom: '1px solid #e2e8f0'}}>{cat}</div>
                                            <div className="checkbox-grid">
                                                {solos.map(s => (
                                                    <label key={s} className="checkbox-item">
                                                        <input type="checkbox" checked={novaPlanta.solosRecomendados?.includes(s)} onChange={() => toggleSolo(s)} />
                                                        {formatarTexto(s)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer" style={{padding: '15px 0 0 0', borderTop: '1px solid #f1f5f9'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={carregando}> {carregando ? "Salvando..." : "Salvar Planta"} </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plantas;