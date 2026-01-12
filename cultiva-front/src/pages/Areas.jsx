import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Areas.css';
import {
    Trash2, Pencil, Plus, MapPin, Sprout, Ruler,
    X, Tractor, Globe, Sun, Cloud, CloudSun,
    AlertCircle
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNotify } from "../context/NotificationContext";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Areas = () => {
    const notify = useNotify();

    const [areas, setAreas] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [idAreaSelecionada, setIdAreaSelecionada] = useState(null);
    const [cultivos, setCultivos] = useState([]);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null, nome: '' });

    const estadoInicial = {
        nomeArea: '',
        localizacaoArea: '',
        tamanhoArea: '',
        tipoSolo: 'ARGILOSO',
        quantidadeLuz: 'PLENO_SOL',
        latitudeArea: -14.235,
        longitudeArea: -51.925
    };

    const [novaArea, setNovaArea] = useState(estadoInicial);

    const CATEGORIAS_SOLO = {
        "Textura e Composição": ["ARGILOSO", "ARENOSO", "SILTOSO", "HUMOSO", "CALCARIO"],
        "Classificação Técnica (Embrapa)": ["LATOSSOLO", "ARGISSOLO", "CHERNOSSOLO", "NEOSSOLO", "CAMBISSOLO", "GLEISSOLO", "NITOSSOLO"],
        "Tipos Regionais / Outros": ["TERRA_ROXA", "MASSAPE", "VARZEA", "MISTO", "OUTRO"]
    };

    function SeletorMapa() {
        useMapEvents({
            click(e) {
                setNovaArea(prev => ({
                    ...prev,
                    latitudeArea: e.latlng.lat,
                    longitudeArea: e.latlng.lng
                }));
            },
        });
        return novaArea.latitudeArea ? <Marker position={[novaArea.latitudeArea, novaArea.longitudeArea]} /> : null;
    }

    const formatarTexto = (texto) => {
        if(!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase().replace(/_/g, ' ');
    };

    const getBadgeStyle = (solo) => {
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
            case 'SOMBRA': return { label: 'Sombra', icon: Cloud, color: '#64748b', bg: '#f1f5f9' };
            case 'MEIA_SOMBRA': return { label: 'Meia Sombra', icon: CloudSun, color: '#d97706', bg: '#fef3c7' };
            default: return { label: 'Sol Pleno', icon: Sun, color: '#ea580c', bg: '#ffedd5' };
        }
    };

    const carregarAreas = () => {
        fetch('http://localhost:8090/api/areas')
            .then(res => res.json())
            .then(dados => setAreas(dados))
            .catch(() => notify("Não foi possível carregar as áreas.", "error"));
    };

    useEffect(() => { carregarAreas(); }, []);

    const totalHectares = areas.reduce((acc, area) => acc + (Number(area.tamanhoArea) || 0), 0).toFixed(1);
    const totalCultivosAtivos = areas.reduce((acc, area) => acc + (area.cultivos ? area.cultivos.length : 0), 0);

    const abrirModal = (area = null) => {
        if (area) {
            setEditandoId(area.idArea);
            setNovaArea({
                ...area,
                latitudeArea: Number(area.latitudeArea) || -14.235,
                longitudeArea: Number(area.longitudeArea) || -51.925
            });
        } else {
            setEditandoId(null);
            setNovaArea(estadoInicial);
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); };

    const salvarArea = (e) => {
        e.preventDefault();
        const url = editandoId ? `http://localhost:8090/api/areas/${editandoId}` : 'http://localhost:8090/api/areas';
        fetch(url, {
            method: editandoId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaArea)
        }).then(res => {
            if (res.ok) {
                carregarAreas();
                fecharModal();
                notify("Área salva com sucesso!", "success");
            }
        }).catch(() => notify("Erro ao salvar área.", "error"));
    };

    const executarExclusao = () => {
        fetch(`http://localhost:8090/api/areas/${confirmacaoExclusao.id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    carregarAreas();
                    notify("Área excluída!", "success");
                    setConfirmacaoExclusao({ aberta: false, id: null, nome: '' });
                }
            });
    };

    const verCultivos = (idArea) => {
        if (idArea === idAreaSelecionada) { setIdAreaSelecionada(null); return; }
        fetch('http://localhost:8090/api/cultivos')
            .then(res => res.json())
            .then(todos => {
                const filtrados = todos.filter(c => c.areaCultivo?.idArea === idArea);
                setCultivos(filtrados);
                setIdAreaSelecionada(idArea);
            });
    };

    return (
        <div className="main-content animate-fade-in">
            {/* HEADER */}
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Áreas de Cultivo</h1>
                    <p className="dashboard-subtitle">Monitoramento e gestão de terrenos agrícolas.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Nova Área
                </button>
            </div>

            {/* KPI STATS */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Total de Setores</span><div className="icon-box bg-green-light"><MapPin size={20} /></div></div>
                    <div className="kpi-value">{areas.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Área Mapeada</span><div className="icon-box bg-blue-light"><Ruler size={20} /></div></div>
                    <div className="kpi-value">{totalHectares} <small>ha</small></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Cultivos Ativos</span><div className="icon-box bg-orange-light"><Tractor size={20} /></div></div>
                    <div className="kpi-value">{totalCultivosAtivos}</div>
                </div>
            </div>

            {/* GRID DE ÁREAS */}
            <div className="areas-grid">
                {areas.map(area => {
                    const luz = getLuzConfig(area.quantidadeLuz);
                    const LuzIcon = luz.icon;
                    const badge = getBadgeStyle(area.tipoSolo);

                    return (
                        <div key={area.idArea} className="area-card">
                            <div className="area-card-header">
                                <div className="area-title">{area.nomeArea}</div>
                                <span className="role-badge" style={{ backgroundColor: badge.bg, color: badge.color, border: badge.border }}>
                                    {formatarTexto(area.tipoSolo)}
                                </span>
                            </div>

                            <div className="area-card-body">
                                <div className="area-info-row">
                                    <span><MapPin size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>Localização</span>
                                    <strong>{area.localizacaoArea}</strong>
                                </div>
                                <div className="area-info-row">
                                    <span><Ruler size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>Tamanho</span>
                                    <strong>{area.tamanhoArea} ha</strong>
                                </div>
                                <div className="area-info-row">
                                    <span><Sun size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>Incidência</span>
                                    <span style={{ color: luz.color, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                        <LuzIcon size={14} /> {luz.label}
                                    </span>
                                </div>
                                <div className="area-info-row">
                                    <span><Globe size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>GPS</span>
                                    <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{Number(area.latitudeArea).toFixed(3)}, {Number(area.longitudeArea).toFixed(3)}</span>
                                </div>
                            </div>

                            {idAreaSelecionada === area.idArea && (
                                <div className="cultivos-list-container" style={{background: '#f8fafc', padding: '12px', marginTop: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                    <h4 style={{fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px'}}>Ativos na Área:</h4>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        {cultivos.length > 0 ? cultivos.map((c, i) => (
                                            <div key={i} style={{display: 'flex', justifyContent: 'space-between', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
                                                    <Sprout size={14} color="#16a34a"/> {c.plantaCultivada?.nomePopular}
                                                </div>
                                                <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>{c.statusCultivo}</span>
                                            </div>
                                        )) : <p style={{fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic'}}>Nenhum cultivo ativo.</p>}
                                    </div>
                                </div>
                            )}

                            <div className="area-card-actions">
                                <button className="btn-outline-sm" style={{flex: 2}} onClick={() => verCultivos(area.idArea)}>
                                    {idAreaSelecionada === area.idArea ? 'Ocultar' : 'Ver Cultivos'}
                                </button>
                                <button className="btn-icon-action" onClick={() => abrirModal(area)}><Pencil size={18} /></button>
                                <button className="btn-icon-action danger" onClick={() => setConfirmacaoExclusao({ aberta: true, id: area.idArea, nome: area.nomeArea })}><Trash2 size={18} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL DE CONFIRMAÇÃO (REUTILIZANDO PADRÃO ADMIN) */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content confirm-modal" style={{maxWidth: '400px'}}>
                        <div className="icon-warning-container"><AlertCircle size={40} /></div>
                        <h3 className="modal-title">Excluir Área?</h3>
                        <p style={{ color: '#64748b', margin: '15px 0' }}>Deseja apagar <strong>{confirmacaoExclusao.nome}</strong>? Esta ação é irreversível.</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoExclusao({ aberta: false })}>Cancelar</button>
                            <button className="btn-danger" onClick={executarExclusao}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORMULÁRIO */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth: '850px'}}>
                        <div className="modal-header-flex" style={{padding: '0 0 20px 0'}}>
                            <h2 className="modal-title">{editandoId ? 'Editar Área' : 'Nova Área'}</h2>
                            <button className="btn-close-modal" onClick={fecharModal}><X size={20} /></button>
                        </div>

                        <form onSubmit={salvarArea}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
                                <div className="form-column">
                                    <div className="form-group">
                                        <label className="form-label">Nome da Área</label>
                                        <input className="form-input" value={novaArea.nomeArea} onChange={e => setNovaArea({...novaArea, nomeArea: e.target.value})} required />
                                    </div>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Hectares (ha)</label>
                                            <input type="number" step="0.1" className="form-input" value={novaArea.tamanhoArea} onChange={e => setNovaArea({...novaArea, tamanhoArea: e.target.value})} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Luz Solar</label>
                                            <select className="form-select" value={novaArea.quantidadeLuz} onChange={e => setNovaArea({...novaArea, quantidadeLuz: e.target.value})}>
                                                <option value="PLENO_SOL">Sol Pleno</option>
                                                <option value="MEIA_SOMBRA">Meia Sombra</option>
                                                <option value="SOMBRA">Sombra</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Solo</label>
                                        <select className="form-select" value={novaArea.tipoSolo} onChange={e => setNovaArea({...novaArea, tipoSolo: e.target.value})}>
                                            {Object.entries(CATEGORIAS_SOLO).map(([cat, solos]) => (
                                                <optgroup key={cat} label={cat}>
                                                    {solos.map(s => <option key={s} value={s}>{formatarTexto(s)}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Referência de Localização</label>
                                        <input className="form-input" value={novaArea.localizacaoArea} onChange={e => setNovaArea({...novaArea, localizacaoArea: e.target.value})} required />
                                    </div>
                                </div>

                                <div className="map-column">
                                    <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <Globe size={16} color="#127F0A"/> Ponto GPS no Mapa
                                    </label>
                                    <div className="map-container-wrapper">
                                        <MapContainer
                                            center={[novaArea.latitudeArea, novaArea.longitudeArea]}
                                            zoom={novaArea.latitudeArea === -14.235 ? 4 : 15}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <SeletorMapa />
                                        </MapContainer>
                                    </div>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                        <div className="form-group">
                                            <label className="form-label">Lat</label>
                                            <input className="form-input" style={{background: '#f8fafc'}} value={Number(novaArea.latitudeArea).toFixed(6)} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Long</label>
                                            <input className="form-input" style={{background: '#f8fafc'}} value={Number(novaArea.longitudeArea).toFixed(6)} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{padding: '20px 0 0 0'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Área</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Areas;