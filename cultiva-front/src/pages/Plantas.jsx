import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Plantas.css';
import {
    Trash2, Plus, Sprout, Clock, Pencil,
    Leaf, Cherry, Bean, Wheat, X, Microscope,
    Droplets, Sun, Flower, AlertCircle, LeafyGreen, Camera,
    ChevronRight, Info
} from 'lucide-react';
import { plantaService } from "../services/api.js";
import { useNotify } from "../context/NotificationContext";

// Comprime imagem (mesma função de Tarefas.jsx)
const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1000;
            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
    };
});

const Plantas = () => {
    const notify = useNotify();

    const [plantas, setPlantas] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
    const [plantaSelecionada, setPlantaSelecionada] = useState(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null, nome: '' });
    const [carregando, setCarregando] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const estadoInicial = {
        nomePopular: '',
        nomeCientifico: '',
        tipoPlanta: 'HORTALICA',
        cicloMedioDias: '',
        solosRecomendados: [],
        aguaRecomendada: 'MEDIA',
        luzRecomendada: 'MEIA_SOMBRA',
        descricaoPlanta: '',
        fotoPlanta: null,
    };

    const [novaPlanta, setNovaPlanta] = useState(estadoInicial);

    const CATEGORIAS_SOLO = {
        "Textura e Composição":           ["ARGILOSO","ARENOSO","SILTOSO","HUMOSO","CALCARIO","FRANCO"],
        "Classificação Técnica (Embrapa)":["LATOSSOLO","ARGISSOLO","CHERNOSSOLO","NEOSSOLO","CAMBISSOLO","GLEISSOLO","NITOSSOLO"],
        "Tipos Regionais / Outros":       ["TERRA_ROXA","MASSAPE","MISTO","OUTRO"],
    };

    const getPlantConfig = (tipo) => {
        switch (tipo) {
            case 'FRUTA':        return { icon: Cherry,    colorClass: 'bg-soft-orange', borderClass: 'border-top-fruta',    badgeStyle: { bg: '#ffedd5', color: '#c2410c' } };
            case 'GRAO':         return { icon: Wheat,     colorClass: 'bg-soft-yellow', borderClass: 'border-top-grao',     badgeStyle: { bg: '#fefce8', color: '#ca8a04' } };
            case 'LEGUME':       return { icon: Bean,      colorClass: 'bg-soft-purple', borderClass: 'border-top-legume',   badgeStyle: { bg: '#faf5ff', color: '#9333ea' } };
            case 'FLOR':         return { icon: Flower,    colorClass: 'bg-soft-pink',   borderClass: 'border-top-flor',     badgeStyle: { bg: '#fdf2f8', color: '#db2777' } };
            case 'TEMPERO':      return { icon: LeafyGreen,colorClass: 'bg-soft-yellow', borderClass: 'border-top-hortalica',badgeStyle: { bg: '#ecfdf5', color: '#059669' } };
            case 'ERVA_MEDICINAL':return{ icon: Microscope,colorClass: 'bg-soft-green',  borderClass: 'border-top-hortalica',badgeStyle: { bg: '#f0fdf4', color: '#16a34a' } };
            default:             return { icon: Leaf,      colorClass: 'bg-soft-green',  borderClass: 'border-top-hortalica',badgeStyle: { bg: '#f0fdf4', color: '#16a34a' } };
        }
    };

    const formatarTexto = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase().replace(/_/g, ' ') : '—';

    const carregarPlantas = async () => {
        try {
            const dados = await plantaService.listar();
            setPlantas(Array.isArray(dados) ? dados : []);
        } catch { notify("Erro ao conectar com o catálogo.", "error"); }
    };

    useEffect(() => { carregarPlantas(); }, []);

    const abrirModal = (planta = null) => {
        if (planta) {
            setEditandoId(planta.idPlanta);
            setNovaPlanta({ ...estadoInicial, ...planta, solosRecomendados: planta.solosRecomendados ? [...planta.solosRecomendados] : [] });
        } else {
            setEditandoId(null);
            setNovaPlanta(estadoInicial);
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); };

    const abrirDetalhe = (planta) => {
        setPlantaSelecionada(planta);
        setModalDetalheAberto(true);
    };

    const handleFotoPlanta = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setNovaPlanta(prev => ({ ...prev, fotoPlanta: compressed }));
        } catch { notify("Erro ao processar imagem.", "error"); }
        e.target.value = '';
    };

    const toggleSolo = (solo) => {
        setNovaPlanta(prev => {
            const solosAtuais = prev.solosRecomendados || [];
            return solosAtuais.includes(solo)
                ? { ...prev, solosRecomendados: solosAtuais.filter(s => s !== solo) }
                : { ...prev, solosRecomendados: [...solosAtuais, solo] };
        });
    };

    const executarExclusao = async () => {
        try {
            await plantaService.excluir(confirmacaoExclusao.id);
            notify("Planta removida.", "success");
            carregarPlantas();
            setConfirmacaoExclusao({ aberta: false });
            if (modalDetalheAberto) setModalDetalheAberto(false);
        } catch { notify("Erro ao excluir. Verifique se está em uso em algum cultivo.", "error"); }
    };

    const salvarPlanta = async (e) => {
        e.preventDefault();
        if (carregando) return;
        setCarregando(true);
        try {
            const dadosFormatados = { ...novaPlanta, cicloMedioDias: Number(novaPlanta.cicloMedioDias) };
            if (editandoId) {
                await plantaService.atualizar(editandoId, dadosFormatados);
            } else {
                await plantaService.criar(dadosFormatados);
            }
            notify("Dados salvos com sucesso!", "success");
            await carregarPlantas();
            fecharModal();
        } catch (err) {
            notify(err.message || "Erro ao salvar planta.", "error");
        } finally {
            setCarregando(false); }
    };

    const mediaCiclo = plantas.length > 0
        ? Math.round(plantas.reduce((acc, p) => acc + (Number(p.cicloMedioDias) || 0), 0) / plantas.length)
        : 0;

    return (
        <div className="main-content animate-fade-in">
            {/* ── HEADER ───────────────────────────────────── */}
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Catálogo de Espécies</h1>
                    <p className="dashboard-subtitle">Base de conhecimento fitotécnico para cultivos.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Nova Espécie
                </button>
            </div>

            {/* ── KPIs ─────────────────────────────────────── */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Espécies Catalogadas</span><div className="icon-box bg-green-light"><Sprout size={20}/></div></div>
                    <div className="kpi-value">{plantas.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Média de Ciclo</span><div className="icon-box bg-orange-light"><Clock size={20}/></div></div>
                    <div className="kpi-value">{mediaCiclo} <small>dias</small></div>
                </div>
            </div>

            {/* ── GRID DE PLANTAS ──────────────────────────── */}
            <div className="plants-grid">
                {plantas.map(planta => {
                    const config = getPlantConfig(planta.tipoPlanta);
                    const PlantIcon = config.icon;

                    return (
                        <div key={planta.idPlanta} className="plant-card"
                            onClick={() => abrirDetalhe(planta)} style={{cursor:'pointer'}}>

                            {/* Topo: foto OU barra colorida */}
                            {planta.fotoPlanta ? (
                                <div className="plant-card-foto-header">
                                    <img src={planta.fotoPlanta} alt={planta.nomePopular} />
                                    <div className="plant-card-foto-badge">
                                        <span className="plant-badge" style={{ backgroundColor: config.badgeStyle.bg, color: config.badgeStyle.color }}>
                                            {formatarTexto(planta.tipoPlanta)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className={`plant-card-top ${config.borderClass}`} />
                            )}

                            <div className="plant-card-content">
                                {/* Se não tem foto, mostra ícone + badge */}
                                {!planta.fotoPlanta && (
                                    <div className="plant-card-header">
                                        <div className={`plant-icon-wrapper ${config.colorClass}`}>
                                            <PlantIcon size={22}/>
                                        </div>
                                        <span className="plant-badge" style={{ backgroundColor: config.badgeStyle.bg, color: config.badgeStyle.color }}>
                                            {formatarTexto(planta.tipoPlanta)}
                                        </span>
                                    </div>
                                )}

                                <h3 className="plant-name">{planta.nomePopular}</h3>
                                <p className="plant-scientific">{planta.nomeCientifico || 'Espécie não identificada'}</p>

                                <div className="plant-info-section">
                                    <div className="cycle-info">
                                        <Clock size={15}/>
                                        <span>Ciclo Médio: <strong>{planta.cicloMedioDias} dias</strong></span>
                                    </div>
                                    <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>
                                        <span className="soil-tag"><Sun size={12} style={{marginRight:3}}/>{formatarTexto(planta.luzRecomendada)}</span>
                                        <span className="soil-tag"><Droplets size={12} style={{marginRight:3}}/>{formatarTexto(planta.aguaRecomendada)}</span>
                                    </div>
                                    <div className="soil-label">Solos Recomendados</div>
                                    <div className="soil-tags-container">
                                        {planta.solosRecomendados?.length > 0
                                            ? planta.solosRecomendados.map(s => <span key={s} className="soil-tag">{formatarTexto(s)}</span>)
                                            : <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>Geral</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Rodapé de ações — stopPropagation para não abrir o detalhe */}
                            <div className="user-actions-footer-planta" onClick={e => e.stopPropagation()}>
                                <button className="btn-outline-sm" onClick={() => abrirModal(planta)}>
                                    <Pencil size={16} style={{marginRight:6}}/> Editar
                                </button>
                                <button className="btn-delete-planta" onClick={() => setConfirmacaoExclusao({aberta:true, id:planta.idPlanta, nome:planta.nomePopular})}>
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ════════════════════════════════════════════
                MODAL: DETALHES DA PLANTA
            ════════════════════════════════════════════ */}
            {modalDetalheAberto && plantaSelecionada && (() => {
                const config = getPlantConfig(plantaSelecionada.tipoPlanta);
                const PlantIcon = config.icon;
                return (
                    <div className="modal-modern-overlay" onClick={() => setModalDetalheAberto(false)}>
                        <div className="plant-detalhe-content" onClick={e => e.stopPropagation()}>

                            {/* Foto ou barra colorida */}
                            {plantaSelecionada.fotoPlanta ? (
                                <div className="plant-detalhe-foto-header">
                                    <img src={plantaSelecionada.fotoPlanta} alt={plantaSelecionada.nomePopular}/>
                                    <button className="btn-close-modal plant-detalhe-close" onClick={() => setModalDetalheAberto(false)}><X size={20}/></button>
                                </div>
                            ) : (
                                <div className={`plant-detalhe-color-header ${config.borderClass}`} style={{background: config.badgeStyle.bg}}>
                                    <div className={`plant-icon-wrapper ${config.colorClass}`} style={{width:'56px', height:'56px', borderRadius:'16px'}}>
                                        <PlantIcon size={28}/>
                                    </div>
                                    <button className="btn-close-modal" onClick={() => setModalDetalheAberto(false)}><X size={20}/></button>
                                </div>
                            )}

                            {/* Corpo */}
                            <div className="plant-detalhe-body">
                                <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'4px'}}>
                                    <div>
                                        <h2 className="plant-detalhe-nome">{plantaSelecionada.nomePopular}</h2>
                                        {plantaSelecionada.nomeCientifico && (
                                            <p className="plant-detalhe-cientifico">{plantaSelecionada.nomeCientifico}</p>
                                        )}
                                    </div>
                                    <span className="plant-badge" style={{ backgroundColor: config.badgeStyle.bg, color: config.badgeStyle.color, flexShrink:0 }}>
                                        {formatarTexto(plantaSelecionada.tipoPlanta)}
                                    </span>
                                </div>

                                {/* Info grid */}
                                <div className="detalhe-secao" style={{marginTop:'16px'}}>
                                    <h4 className="detalhe-secao-titulo">Características Técnicas</h4>
                                    <div className="detalhe-grid">
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Ciclo Médio</span>
                                            <span className="detalhe-valor">{plantaSelecionada.cicloMedioDias} dias</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Tipo</span>
                                            <span className="detalhe-valor">{formatarTexto(plantaSelecionada.tipoPlanta)}</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Necessidade Hídrica</span>
                                            <span className="detalhe-valor"><Droplets size={13} style={{display:'inline',marginRight:'4px'}}/>{formatarTexto(plantaSelecionada.aguaRecomendada)}</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Luz Recomendada</span>
                                            <span className="detalhe-valor"><Sun size={13} style={{display:'inline',marginRight:'4px'}}/>{formatarTexto(plantaSelecionada.luzRecomendada)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Solos */}
                                {plantaSelecionada.solosRecomendados?.length > 0 && (
                                    <div className="detalhe-secao" style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
                                        <h4 className="detalhe-secao-titulo" style={{color:'#16a34a'}}>Solos Recomendados</h4>
                                        <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                                            {plantaSelecionada.solosRecomendados.map(s => (
                                                <span key={s} className="soil-tag">{formatarTexto(s)}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Descrição */}
                                {plantaSelecionada.descricaoPlanta && (
                                    <div className="detalhe-secao">
                                        <h4 className="detalhe-secao-titulo"><Info size={12} style={{display:'inline',marginRight:'4px'}}/>Descrição / Observações</h4>
                                        <p style={{margin:0, color:'#475569', lineHeight:1.6, fontSize:'0.9rem'}}>{plantaSelecionada.descricaoPlanta}</p>
                                    </div>
                                )}
                            </div>

                            {/* Rodapé */}
                            <div className="plant-detalhe-footer">
                                {/*<button className="link-action" onClick={() => setModalDetalheAberto(false)}>Fechar</button>*/}
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button className="btn-outline" onClick={() => { setModalDetalheAberto(false); abrirModal(plantaSelecionada); }}>
                                        <Pencil size={15}/> Editar
                                    </button>
                                    <button className="btn-danger" style={{padding:'8px 16px', fontSize:'0.85rem'}}
                                        onClick={() => { setModalDetalheAberto(false); setConfirmacaoExclusao({aberta:true, id:plantaSelecionada.idPlanta, nome:plantaSelecionada.nomePopular}); }}>
                                        <Trash2 size={15}/> Remover
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ════════════════════════════════════════════
                MODAL: EXCLUSÃO
            ════════════════════════════════════════════ */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content confirm-modal" style={{maxWidth:'400px'}}>
                        <div className="icon-warning-container"><AlertCircle size={40}/></div>
                        <h3 className="modal-title">Excluir Espécie?</h3>
                        <p style={{color:'#64748b', margin:'15px 0'}}>Remover <strong>{confirmacaoExclusao.nome}</strong> do catálogo?</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoExclusao({aberta:false})}>Cancelar</button>
                            <button className="btn-danger" onClick={executarExclusao}>Remover</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: CADASTRO / EDIÇÃO
            ════════════════════════════════════════════ */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth:'680px', padding:'1.5rem'}}>
                        <div className="modal-header-flex" style={{padding:'0 0 14px 0', marginBottom:'10px'}}>
                            <h2 className="modal-title" style={{fontSize:'1.25rem'}}>{editandoId ? 'Atualizar Dados' : 'Nova Espécie'}</h2>
                            <button className="btn-close-modal" onClick={fecharModal}><X size={20}/></button>
                        </div>

                        <form onSubmit={salvarPlanta}>
                            {/* ── Foto ── */}
                            <div className="form-group" style={{marginBottom:'16px'}}>
                                <label className="form-label">Foto da Planta</label>
                                {novaPlanta.fotoPlanta ? (
                                    <div className="planta-foto-form-preview">
                                        <img src={novaPlanta.fotoPlanta} alt="Preview" />
                                        <button type="button" className="planta-foto-remover"
                                            onClick={() => setNovaPlanta(prev => ({...prev, fotoPlanta: null}))}>
                                            <X size={13}/> Remover foto
                                        </button>
                                    </div>
                                ) : (
                                    <label className="planta-foto-upload-btn">
                                        <Camera size={18}/> Adicionar Foto da Planta
                                        <input type="file" accept="image/*" hidden onChange={handleFotoPlanta}/>
                                    </label>
                                )}
                            </div>

                            {/* ── Campos principais ── */}
                            <div className="form-compact-grid">
                                <div className="form-group">
                                    <label className="form-label">Nome Popular *</label>
                                    <input className="form-input" value={novaPlanta.nomePopular}
                                        onChange={e => setNovaPlanta({...novaPlanta, nomePopular: e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nome Científico</label>
                                    <input className="form-input" style={{fontStyle:'italic'}} value={novaPlanta.nomeCientifico}
                                        onChange={e => setNovaPlanta({...novaPlanta, nomeCientifico: e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ciclo Médio (dias) *</label>
                                    <input type="number" min="1" className="form-input" value={novaPlanta.cicloMedioDias}
                                        onChange={e => setNovaPlanta({...novaPlanta, cicloMedioDias: e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo de Cultura *</label>
                                        <select 
                                            className="form-select" 
                                            value={novaPlanta.tipoPlanta}
                                            onChange={e => setNovaPlanta({...novaPlanta, tipoPlanta: e.target.value})}
                                        >
                                            <option value="" disabled>Selecione uma categoria...</option>

                                            {/* GRUPO 1: Lavouras Temporárias */}
                                            <optgroup label="Lavouras Temporárias">
                                                <option value="CEREAL">Cereais (Milho, Arroz, Trigo...)</option>
                                                <option value="OLEAGINOSA">Oleaginosas (Soja, Girassol...)</option>
                                                <option value="LEGUMINOSA">Leguminosas / Pulses (Feijão, Lentilha...)</option>
                                                <option value="FIBRA">Fibras (Algodão, Juta...)</option>
                                                <option value="CULTURA_INDUSTRIAL">Culturas Industriais (Cana, Fumo...)</option>
                                                <option value="FORRAGEIRA">Forrageiras (Pastagem, Sorgo...)</option>
                                            </optgroup>

                                            {/* GRUPO 2: Horticultura */}
                                            <optgroup label="Horticultura">
                                                <option value="HORTALICA_FOLHOSA">Hortaliças: Folhas e Hastes (Alface, Couve...)</option>
                                                <option value="HORTALICA_FRUTO">Hortaliças: Frutos de Horta (Tomate, Abóbora...)</option>
                                                <option value="HORTALICA_RAIZ">Hortaliças: Raízes/Bulbos (Cenoura, Cebola...)</option>
                                                <option value="TEMPERO_AROMATICA">Condimentares e Aromáticas (Temperos)</option>
                                                <option value="MEDICINAL">Plantas Medicinais</option>
                                                <option value="ORNAMENTAL">Floricultura e Ornamentais</option>
                                                <option value="FUNGICULTURA">Fungicultura (Cogumelos)</option>
                                            </optgroup>

                                            {/* GRUPO 3: Fruticultura */}
                                            <optgroup label="Fruticultura (Permanentes)">
                                                <option value="FRUTA_CARNOSA">Frutas Carnosas (Laranja, Maçã, Banana...)</option>
                                                <option value="FRUTO_SECO">Frutos Secos e Nozes (Castanhas, Macadâmia...)</option>
                                                <option value="FRUTO_INDUSTRIAL">Frutos Industriais (Café, Cacau, Dendê...)</option>
                                            </optgroup>
                                        </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Necessidade Hídrica *</label>
                                    <select className="form-select" value={novaPlanta.aguaRecomendada}
                                        onChange={e => setNovaPlanta({...novaPlanta, aguaRecomendada: e.target.value})}>
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Luz Recomendada *</label>
                                    <select className="form-select" value={novaPlanta.luzRecomendada}
                                        onChange={e => setNovaPlanta({...novaPlanta, luzRecomendada: e.target.value})}>
                                        <option value="SOMBRA">Sombra</option>
                                        <option value="MEIA_SOMBRA">Meia Sombra</option>
                                        <option value="PLENO_SOL">Pleno Sol</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Solos ── */}
                            <div className="form-group" style={{marginTop:'4px'}}>
                                <label className="form-label">Solos Ideais para Cultivo</label>
                                <div style={{maxHeight:'120px', overflowY:'auto', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'10px', background:'#f8fafc'}}>
                                    {Object.entries(CATEGORIAS_SOLO).map(([cat, solos]) => (
                                        <div key={cat} style={{marginBottom:'10px'}}>
                                            <div style={{fontSize:'0.65rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', marginBottom:'5px', borderBottom:'1px solid #e2e8f0'}}>{cat}</div>
                                            <div className="checkbox-grid">
                                                {solos.map(s => (
                                                    <label key={s} className="checkbox-item">
                                                        <input type="checkbox" checked={novaPlanta.solosRecomendados?.includes(s)} onChange={() => toggleSolo(s)}/>
                                                        {formatarTexto(s)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Descrição ── */}
                            <div className="form-group" style={{marginTop:'12px'}}>
                                <label className="form-label">Descrição / Observações</label>
                                <textarea className="form-input" rows="3" style={{resize:'vertical'}}
                                    placeholder="Características especiais, cuidados, dicas de manejo..."
                                    value={novaPlanta.descricaoPlanta}
                                    onChange={e => setNovaPlanta({...novaPlanta, descricaoPlanta: e.target.value})}/>
                            </div>

                            <div className="modal-footer" style={{padding:'15px 0 0 0', borderTop:'1px solid #f1f5f9'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={carregando}>
                                    {carregando ? "Salvando..." : "Salvar Espécie"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plantas;
