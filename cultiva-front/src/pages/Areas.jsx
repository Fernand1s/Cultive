import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Areas.css';
import {
    Trash2, Pencil, Plus, MapPin, Sprout, Ruler,
    X, Tractor, Globe, Sun, Cloud, CloudSun,
    AlertCircle, Mountain, History, CheckCircle2, Clock, Layers
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNotify } from "../context/NotificationContext";

import { areaService, cultivoService } from '../services/api';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ─── Configurações de status da área ─────────────────────────────
const STATUS_CONFIG = {
    EM_POUSIO:          { label: 'Em Pousio',            cor: '#64748b', bg: '#f1f5f9', borda: '#cbd5e1', Icone: Clock },
    EM_PREPARO:         { label: 'Em Preparo',           cor: '#d97706', bg: '#fef3c7', borda: '#fde68a', Icone: Tractor },
    PRONTO_PARA_PLANTIO:{ label: 'Pronto p/ Plantio',    cor: '#2563eb', bg: '#eff6ff', borda: '#bfdbfe', Icone: CheckCircle2 },
    EM_CULTIVO:         { label: 'Em Cultivo',           cor: '#16a34a', bg: '#f0fdf4', borda: '#bbf7d0', Icone: Sprout },
};

const TOPOGRAFIA_CONFIG = {
    PLANO:     { label: 'Plano',     cor: '#0284c7', bg: '#e0f2fe' },
    ONDULADO:  { label: 'Ondulado',  cor: '#d97706', bg: '#fef3c7' },
    ACIDENTADO:{ label: 'Acidentado',cor: '#dc2626', bg: '#fee2e2' },
};

const CATEGORIAS_SOLO = {
    "Textura e Composição":           ["ARGILOSO","ARENOSO","SILTOSO","HUMOSO","CALCARIO"],
    "Classificação Técnica (Embrapa)":["LATOSSOLO","ARGISSOLO","CHERNOSSOLO","NEOSSOLO","CAMBISSOLO","GLEISSOLO","NITOSSOLO"],
    "Tipos Regionais / Outros":       ["TERRA_ROXA","MASSAPE","VARZEA","MISTO","OUTRO"],
};

const Areas = () => {
    const notify = useNotify();

    const [areas, setAreas] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [idAreaSelecionada, setIdAreaSelecionada] = useState(null);
    const [cultivos, setCultivos] = useState([]);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null, nome: '' });
    const [salvando, setSalvando] = useState(false);

    const estadoInicial = {
        nomeArea: '',
        localizacaoArea: '',
        tamanhoArea: '',
        tipoSolo: 'ARGILOSO',
        quantidadeLuz: 'PLENO_SOL',
        topografia: 'PLANO',
        statusArea: 'EM_PREPARO',
        culturaAnterior: '',
        observacaoArea: '',
        latitudeArea: -14.235,
        longitudeArea: -51.925,
    };

    const [novaArea, setNovaArea] = useState(estadoInicial);

    function SeletorMapa() {
        useMapEvents({
            click(e) {
                setNovaArea(prev => ({
                    ...prev,
                    latitudeArea: e.latlng.lat,
                    longitudeArea: e.latlng.lng,
                }));
            },
        });
        return novaArea.latitudeArea ? <Marker position={[novaArea.latitudeArea, novaArea.longitudeArea]} /> : null;
    }

    const formatarTexto = (texto) => {
        if (!texto) return '—';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase().replace(/_/g, ' ');
    };

    const getBadgeSolo = (solo) => {
        const tipo = solo ? solo.toUpperCase() : '';
        if (tipo.includes('ARGIL') || tipo === 'TERRA_ROXA' || tipo === 'NITOSSOLO')
            return { bg: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
        if (tipo.includes('ARENOSO') || tipo === 'NEOSSOLO')
            return { bg: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' };
        if (tipo.includes('HUM') || tipo === 'CHERNOSSOLO' || tipo === 'MASSAPE')
            return { bg: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
        return { bg: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
    };

    const getLuzConfig = (luz) => {
        switch (luz) {
            case 'SOMBRA':     return { label: 'Sombra',     icon: Cloud,    color: '#64748b', bg: '#f1f5f9' };
            case 'MEIA_SOMBRA':return { label: 'Meia Sombra',icon: CloudSun, color: '#d97706', bg: '#fef3c7' };
            default:           return { label: 'Sol Pleno',  icon: Sun,      color: '#ea580c', bg: '#ffedd5' };
        }
    };

    const carregarAreas = async () => {
        try {
            const dados = await areaService.listar();
            setAreas(dados);
        } catch (error) {
            notify(error.message, "error");
        }
    };

    useEffect(() => { carregarAreas(); }, []);

    const totalHectares = areas.reduce((acc, a) => acc + (Number(a.tamanhoArea) || 0), 0).toFixed(1);
    const emCultivo = areas.filter(a => a.statusArea === 'EM_CULTIVO').length;
    const prontasPlantio = areas.filter(a => a.statusArea === 'PRONTO_PARA_PLANTIO').length;

    const abrirModal = (area = null) => {
        if (area) {
            setEditandoId(area.idArea);
            setNovaArea({
                ...estadoInicial,
                ...area,
                latitudeArea: Number(area.latitudeArea) || -14.235,
                longitudeArea: Number(area.longitudeArea) || -51.925,
            });
            setModalAberto(true);
        } else {
            setEditandoId(null);
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setNovaArea({ ...estadoInicial, latitudeArea: pos.coords.latitude, longitudeArea: pos.coords.longitude });
                        setModalAberto(true);
                    },
                    () => { setNovaArea(estadoInicial); setModalAberto(true); },
                    { enableHighAccuracy: true }
                );
            } else {
                setNovaArea(estadoInicial);
                setModalAberto(true);
            }
        }
    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditandoId(null);
        setNovaArea(estadoInicial);
    };

    const set = (campo) => (e) => setNovaArea(prev => ({ ...prev, [campo]: e.target.value }));

    const salvarArea = async (e) => {
        e.preventDefault();
        if (salvando) return;
        setSalvando(true);
        try {
            const payload = {
                ...novaArea,
                tamanhoArea: parseFloat(novaArea.tamanhoArea),
                latitudeArea: parseFloat(novaArea.latitudeArea),
                longitudeArea: parseFloat(novaArea.longitudeArea),
            };

            if (editandoId) {
                await areaService.atualizar(editandoId, payload);
            } else {
                await areaService.criar(payload);
            }

            await carregarAreas();
            fecharModal();
            notify(editandoId ? "Área atualizada!" : "Área cadastrada!", "success");
        } catch (error) {
            notify(error.message, "error");
        } finally {
            setSalvando(false);
        }
    };

    const executarExclusao = async () => {
        try {
            await areaService.excluir(confirmacaoExclusao.id);
            await carregarAreas();
            notify("Área excluída!", "success");
            setConfirmacaoExclusao({ aberta: false, id: null, nome: '' });
        } catch (error) {
            notify(error.message, "error");
        }
    };

    const verCultivos = async (idArea) => {
        if (idArea === idAreaSelecionada) { setIdAreaSelecionada(null); return; }
        try {
            const todos = await cultivoService.listar();
            setCultivos(todos.filter(c => (c.idArea || c.areaCultivo?.idArea) === idArea));
            setIdAreaSelecionada(idArea);
        } catch {
            notify("Erro ao carregar cultivos.", "error");
        }
    };

    return (
        <div className="main-content animate-fade-in">
            {/* ── HEADER ────────────────────────────────────────── */}
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Áreas / Talhões</h1>
                    <p className="dashboard-subtitle">Gestão e monitoramento das parcelas agrícolas.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Novo Talhão
                </button>
            </div>

            {/* ── KPIs ──────────────────────────────────────────── */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Total de Talhões</span><div className="icon-box bg-green-light"><Layers size={20} /></div></div>
                    <div className="kpi-value">{areas.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Área Total</span><div className="icon-box bg-blue-light"><Ruler size={20} /></div></div>
                    <div className="kpi-value">{totalHectares} <small>ha</small></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Em Cultivo</span><div className="icon-box bg-orange-light"><Sprout size={20} /></div></div>
                    <div className="kpi-value">{emCultivo}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Prontos p/ Plantio</span><div className="icon-box" style={{background:'#eff6ff'}}><CheckCircle2 size={20} color="#2563eb" /></div></div>
                    <div className="kpi-value">{prontasPlantio}</div>
                </div>
            </div>

            {/* ── GRID DE ÁREAS ─────────────────────────────────── */}
            <div className="areas-grid">
                {areas.length === 0 && (
                    <div style={{gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'#94a3b8'}}>
                        <Layers size={48} style={{marginBottom:'16px', opacity:0.4}} />
                        <p>Nenhum talhão cadastrado. Clique em "Novo Talhão" para começar.</p>
                    </div>
                )}
                {areas.map(area => {
                    const luz = getLuzConfig(area.quantidadeLuz);
                    const LuzIcon = luz.icon;
                    const badgeSolo = getBadgeSolo(area.tipoSolo);
                    const statusCfg = STATUS_CONFIG[area.statusArea] || STATUS_CONFIG.EM_POUSIO;
                    const StatusIcon = statusCfg.Icone;
                    const topoCfg = TOPOGRAFIA_CONFIG[area.topografia];

                    return (
                        <div key={area.idArea} className="area-card">
                            {/* Barra de status no topo do card */}
                            <div className="area-status-bar" style={{ background: statusCfg.cor }} />

                            <div className="area-card-header">
                                <div>
                                    <div className="area-title">{area.nomeArea}</div>
                                    <span className="area-status-badge" style={{ background: statusCfg.bg, color: statusCfg.cor, border: `1px solid ${statusCfg.borda}` }}>
                                        <StatusIcon size={11} /> {statusCfg.label}
                                    </span>
                                </div>
                                <span className="role-badge" style={{ backgroundColor: badgeSolo.bg, color: badgeSolo.color, border: badgeSolo.border }}>
                                    {formatarTexto(area.tipoSolo)}
                                </span>
                            </div>

                            <div className="area-card-body">
                                <div className="area-info-row">
                                    <span><Ruler size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>Área Útil</span>
                                    <strong>{area.tamanhoArea} ha</strong>
                                </div>
                                <div className="area-info-row">
                                    <span><MapPin size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>Localização</span>
                                    <strong style={{maxWidth:'55%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{area.localizacaoArea || '—'}</strong>
                                </div>
                                <div className="area-info-row">
                                    <span><Mountain size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>Topografia</span>
                                    {topoCfg ? (
                                        <span style={{background:topoCfg.bg, color:topoCfg.cor, padding:'2px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700}}>
                                            {topoCfg.label}
                                        </span>
                                    ) : <span style={{color:'#94a3b8'}}>—</span>}
                                </div>
                                <div className="area-info-row">
                                    <span><Sun size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>Incidência</span>
                                    <span style={{color:luz.color, display:'flex', alignItems:'center', gap:'4px', fontWeight:700, fontSize:'0.85rem'}}>
                                        <LuzIcon size={13}/>{luz.label}
                                    </span>
                                </div>
                                {area.culturaAnterior && (
                                    <div className="area-info-row">
                                        <span><History size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>Cult. Anterior</span>
                                        <span style={{color:'#475569', fontSize:'0.82rem', fontWeight:600, maxWidth:'55%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                            {area.culturaAnterior}
                                        </span>
                                    </div>
                                )}
                                <div className="area-info-row">
                                    <span><Globe size={14} style={{marginRight:'6px',verticalAlign:'middle'}}/>GPS</span>
                                    <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>
                                        {Number(area.latitudeArea).toFixed(4)}, {Number(area.longitudeArea).toFixed(4)}
                                    </span>
                                </div>
                            </div>

                            {idAreaSelecionada === area.idArea && (
                                <div className="cultivos-list-container">
                                    <h4 style={{fontSize:'0.7rem',color:'#64748b',textTransform:'uppercase',marginBottom:'10px',letterSpacing:'0.5px'}}>Cultivos Ativos</h4>
                                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                                        {cultivos.length > 0 ? cultivos.map((c, i) => (
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',background:'white',padding:'8px 12px',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.85rem'}}>
                                                    <Sprout size={14} color="#16a34a"/> {c.plantaCultivada?.nomePopular}
                                                </div>
                                                <span style={{fontSize:'0.75rem',color:'#94a3b8'}}>{c.statusCultivo}</span>
                                            </div>
                                        )) : <p style={{fontSize:'0.8rem',color:'#94a3b8',fontStyle:'italic',margin:0}}>Nenhum cultivo ativo.</p>}
                                    </div>
                                </div>
                            )}

                            <div className="area-card-actions">
                                <button className="btn-outline-sm" style={{flex:2}} onClick={() => verCultivos(area.idArea)}>
                                    {idAreaSelecionada === area.idArea ? 'Ocultar' : 'Ver Cultivos'}
                                </button>
                                <button className="btn-icon-action" onClick={() => abrirModal(area)}><Pencil size={18}/></button>
                                <button className="btn-icon-action danger" onClick={() => setConfirmacaoExclusao({aberta:true,id:area.idArea,nome:area.nomeArea})}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── MODAL CONFIRMAÇÃO EXCLUSÃO ─────────────────────── */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content confirm-modal" style={{maxWidth:'400px'}}>
                        <div className="icon-warning-container"><AlertCircle size={40}/></div>
                        <h3 className="modal-title">Excluir Talhão?</h3>
                        <p style={{color:'#64748b',margin:'15px 0'}}>Deseja apagar <strong>{confirmacaoExclusao.nome}</strong>? Esta ação é irreversível e removerá todos os cultivos associados.</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoExclusao({aberta:false})}>Cancelar</button>
                            <button className="btn-danger" onClick={executarExclusao}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CADASTRO / EDIÇÃO ────────────────────────── */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content-area" >
                        <div className="modal-header-flex" style={{padding:'0 0 20px 0'}}>
                            <h2 className="modal-title">{editandoId ? 'Editar Talhão' : 'Novo Talhão'}</h2>
                            <button className="btn-close-modal" onClick={fecharModal}><X size={20}/></button>
                        </div>

                        <form onSubmit={salvarArea}>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>

                                {/* ── Coluna esquerda: dados ── */}
                                <div className="form-column">

                                    {/* Identificação */}
                                    <div className="area-form-section-title">Identificação e Dimensão</div>
                                    <div className="form-group">
                                        <label className="form-label">Nome / Código do Talhão *</label>
                                        <input className="form-input" placeholder="Ex: Gleba Sul ou T-01"
                                            value={novaArea.nomeArea} onChange={set('nomeArea')} required />
                                    </div>

                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Área Útil (ha) *</label>
                                            <input type="number" step="0.01" min="0.01" className="form-input"
                                                placeholder="0.00"
                                                value={novaArea.tamanhoArea} onChange={set('tamanhoArea')} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Status da Área *</label>
                                            <select className="form-select" value={novaArea.statusArea} onChange={set('statusArea')}>
                                                <option value="EM_POUSIO">Em Pousio</option>
                                                <option value="EM_PREPARO">Em Preparo</option>
                                                <option value="PRONTO_PARA_PLANTIO">Pronto para Plantio</option>
                                                <option value="EM_CULTIVO">Em Cultivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Referência de Localização *</label>
                                        <input className="form-input" placeholder="Ex: Fazenda Boa Vista, setor leste"
                                            value={novaArea.localizacaoArea} onChange={set('localizacaoArea')} required />
                                    </div>

                                    {/* Agronômico */}
                                    <div className="area-form-section-title" style={{marginTop:'8px'}}>Dados Agronômicos</div>

                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Tipo de Solo *</label>
                                            <select className="form-select" value={novaArea.tipoSolo} onChange={set('tipoSolo')}>
                                                {Object.entries(CATEGORIAS_SOLO).map(([cat, solos]) => (
                                                    <optgroup key={cat} label={cat}>
                                                        {solos.map(s => <option key={s} value={s}>{formatarTexto(s)}</option>)}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Topografia / Declividade</label>
                                            <select className="form-select" value={novaArea.topografia} onChange={set('topografia')}>
                                                <option value="PLANO">Plano — aceita maquinário pesado</option>
                                                <option value="ONDULADO">Ondulado — maquinário leve</option>
                                                <option value="ACIDENTADO">Acidentado — trabalho manual</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Incidência Solar</label>
                                            <select className="form-select" value={novaArea.quantidadeLuz} onChange={set('quantidadeLuz')}>
                                                <option value="PLENO_SOL">Sol Pleno</option>
                                                <option value="MEIA_SOMBRA">Meia Sombra</option>
                                                <option value="SOMBRA">Sombra</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Cultura Anterior</label>
                                            <input className="form-input" placeholder="Ex: Soja, Milho, Pousio..."
                                                value={novaArea.culturaAnterior} onChange={set('culturaAnterior')} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Observações Gerais</label>
                                        <textarea className="form-input" rows="2"
                                            placeholder="Características especiais, restrições de acesso, etc."
                                            value={novaArea.observacaoArea} onChange={set('observacaoArea')}
                                            style={{resize:'vertical', height:'110px'}} />
                                    </div>
                                </div>

                                {/* ── Coluna direita: mapa ── */}
                                <div className="map-column">
                                    <div className="area-form-section-title">Ponto GPS no Mapa</div>
                                    <p style={{fontSize:'0.8rem', color:'#94a3b8', margin:'0 0 10px'}}>Clique no mapa para marcar o ponto de referência do talhão.</p>
                                    <div className="map-container-wrapper">
                                        <MapContainer
                                            center={[novaArea.latitudeArea, novaArea.longitudeArea]}
                                            zoom={novaArea.latitudeArea === -14.235 ? 4 : 15}
                                            style={{height:'100%', width:'100%'}}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <SeletorMapa />
                                        </MapContainer>
                                    </div>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'10px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Latitude</label>
                                            <input className="form-input" style={{background:'#f8fafc', color:'#64748b'}}
                                                value={Number(novaArea.latitudeArea).toFixed(6)} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Longitude</label>
                                            <input className="form-input" style={{background:'#f8fafc', color:'#64748b'}}
                                                value={Number(novaArea.longitudeArea).toFixed(6)} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{padding:'20px 0 0 0'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal} disabled={salvando}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={salvando}>
                                    {salvando ? 'Salvando...' : (editandoId ? 'Salvar Alterações' : 'Cadastrar Talhão')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Areas;
