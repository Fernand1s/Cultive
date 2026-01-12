import { useState, useEffect } from 'react';
import '../App.css';
import '../css/cultivos.css';
import {
    Trash2, Plus, Calendar, Activity, Pencil, Droplets,
    Bug, Sprout, MapPin, Flag, CheckCircle2, AlertTriangle, X, Save, TrendingUp, Clock, AlertCircle
} from 'lucide-react';

import { useNotify } from "../context/NotificationContext";

const Cultivos = () => {
    const notify = useNotify();

    // --- ESTADOS ---
    const [cultivos, setCultivos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [plantas, setPlantas] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null });

    const [formCultivo, setFormCultivo] = useState({
        idArea: '', idPlanta: '', quantidadePlantada: '', dataPlantio: '',
        statusCultivo: 'ATIVO', estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
        quantidadeColhida: 0, dataColheitaFinal: ''
    });

    const [modalEventoAberto, setModalEventoAberto] = useState(false);
    const [acaoEvento, setAcaoEvento] = useState(null);
    const [dadosEvento, setDadosEvento] = useState({
        volume: '', metodo: 'GOTEJAMENTO', nome: '', nivel: 'BAIXO', obs: '', dataHora: ''
    });

    const [errosCampos, setErrosCampos] = useState([]);

    // --- CARREGAMENTO ---
    const carregarTudo = () => {
        fetch('http://localhost:8090/api/areas').then(r => r.json()).then(setAreas).catch(() => notify("Erro ao carregar áreas", "error"));
        fetch('http://localhost:8090/api/plantas').then(r => r.json()).then(setPlantas).catch(() => notify("Erro ao carregar plantas", "error"));
        fetch('http://localhost:8090/api/cultivos').then(r => r.json()).then(setCultivos).catch(() => notify("Erro ao carregar cultivos", "error"));
    };

    useEffect(() => { carregarTudo(); }, []);

    // --- STATS ---
    const totalAtivos = cultivos.filter(c => c.statusCultivo === 'ATIVO').length;
    const totalColhidos = cultivos.filter(c => c.statusCultivo === 'COLHIDO').length;
    const totalAlertas = cultivos.filter(c => c.statusCultivo === 'ATIVO' && (c.estadoPlanta !== 'SAUDAVEL')).length;

    // --- FUNÇÕES CULTIVO ---
    const abrirModal = (cultivo = null) => {
        setErrosCampos([]);
        if (cultivo) {
            setEditandoId(cultivo.idCultivo);
            setFormCultivo({
                idArea: cultivo.areaCultivo?.idArea || '',
                idPlanta: cultivo.plantaCultivada?.idPlanta || '',
                quantidadePlantada: cultivo.quantidadePlantada,
                dataPlantio: cultivo.dataPlantio,
                statusCultivo: cultivo.statusCultivo,
                estadoPlanta: cultivo.estadoPlanta,
                observacaoCultivo: cultivo.observacaoCultivo || '',
                quantidadeColhida: cultivo.quantidadeColhida || 0,
                dataColheitaFinal: cultivo.dataColheitaFinal || ''
            });
        } else {
            setEditandoId(null);
            setFormCultivo({
                idArea: '', idPlanta: '', quantidadePlantada: '', dataPlantio: '',
                statusCultivo: 'ATIVO', estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
                quantidadeColhida: 0, dataColheitaFinal: ''
            });
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); setErrosCampos([]); };

    const salvarCultivo = async (e) => {
        e.preventDefault();
        setCarregando(true);

        if (editandoId) {
            // --- LÓGICA PARA O PUT (Atualizar) ---
            // Seu Controller usa @RequestBody, então enviamos JSON no corpo
            const payload = {
                quantidadePlantada: parseFloat(formCultivo.quantidadePlantada),
                statusCultivo: formCultivo.statusCultivo,
                estadoPlanta: formCultivo.estadoPlanta,
                observacaoCultivo: formCultivo.observacaoCultivo,
                quantidadeColhida: parseFloat(formCultivo.quantidadeColhida) || 0,
                dataColheitaFinal: formCultivo.dataColheitaFinal || null
            };

            try {
                const response = await fetch(`http://localhost:8090/api/cultivos/${editandoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    notify("Cultivo atualizado!", "success");
                    fecharModal();
                    carregarTudo();
                }
            } catch (err) {
                notify("Erro ao atualizar.", "error");
            }
        } else {
            // --- LÓGICA PARA O POST (Criar) ---
            // Seu Controller usa @RequestParam, então os dados vão na URL
            const params = new URLSearchParams({
                idPlanta: formCultivo.idPlanta,
                idArea: formCultivo.idArea,
                quantidadePlantada: formCultivo.quantidadePlantada,
                dataPlantio: formCultivo.dataPlantio
            });

            try {
                const response = await fetch(`http://localhost:8090/api/cultivos?${params.toString()}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    notify("Novo cultivo criado!", "success");
                    fecharModal();
                    carregarTudo();
                }
            } catch (err) {
                notify("Erro ao criar cultivo.", "error");
            }
        }
        setCarregando(false);
    };

    const executarExclusao = () => {
        fetch(`http://localhost:8090/api/cultivos/${confirmacaoExclusao.id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    carregarTudo();
                    notify("Cultivo removido.", "success");
                }
                setConfirmacaoExclusao({ aberta: false, id: null });
            });
    };

    // --- FUNÇÕES EVENTOS (MODAL) ---
    const abrirModalEvento = (tipo, cultivo) => {
        setErrosCampos([]);
        setAcaoEvento({
            tipo,
            id: cultivo.idCultivo,
            nomePlanta: cultivo.plantaCultivada?.nomePopular || 'Planta'
        });
        setDadosEvento({
            volume: '', metodo: 'GOTEJAMENTO', nome: '', nivel: 'BAIXO',
            obs: '', dataHora: new Date().toISOString().slice(0, 16)
        });
        setModalEventoAberto(true);
    };

    const salvarEvento = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setErrosCampos([]);

        // Sanitização dos campos de texto para evitar erro 500 na URL
        const obsEscaped = encodeURIComponent(dadosEvento.obs);
        const nomeEscaped = encodeURIComponent(dadosEvento.nome);

        let url = acaoEvento.tipo === 'IRRIGACAO'
            ? `http://localhost:8090/api/eventos/irrigacao?cultivoId=${acaoEvento.id}&volume=${dadosEvento.volume}&metodo=${dadosEvento.metodo}&obs=${obsEscaped}&dataHora=${dadosEvento.dataHora}`
            : `http://localhost:8090/api/eventos/praga?cultivoId=${acaoEvento.id}&nome=${nomeEscaped}&nivel=${dadosEvento.nivel}&obs=${obsEscaped}&dataHora=${dadosEvento.dataHora}`;

        try {
            const res = await fetch(url, { method: 'POST' });
            if (res.ok) {
                notify(acaoEvento.tipo === 'IRRIGACAO' ? 'Irrigação registrada!' : 'Ocorrência de praga registrada!', "success");
                setModalEventoAberto(false);
                carregarTudo();
            } else {
                // Se houver erro 500 ou 400 no backend
                setErrosCampos(['volume', 'nome', 'dataHora']);
                notify("Erro no servidor ao registrar evento.", "error");
            }
        } catch (err) {
            notify("Erro de rede. Tente novamente.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const getHealthLabel = (health) => {
        if (health === 'SAUDAVEL') return { icon: CheckCircle2, text: 'Saudável', color: '#16a34a', class: 'health-saudavel' };
        if (health === 'EM_ATENCAO') return { icon: AlertTriangle, text: 'Atenção', color: '#eab308', class: 'health-atencao' };
        if (health === 'COM_PRAGA') return { icon: Bug, text: 'Com Praga', color: '#f97316', class: 'health-atencao' };
        return { icon: Activity, text: 'Crítico', color: '#ef4444', class: 'health-critico' };
    };

    const formatarData = (ds) => ds ? ds.split('-').reverse().join('/') : '--/--/----';

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Controle de Cultivos</h1>
                    <p className="dashboard-subtitle">Gestão fitotécnica e monitoramento de safra.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20} /> Novo Cultivo
                </button>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Em Produção</span><div className="icon-box bg-green-light"><Sprout size={20} /></div></div>
                    <div className="kpi-value">{totalAtivos}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Alertas Saúde</span><div className="icon-box bg-red-light"><Activity size={20} /></div></div>
                    <div className="kpi-value" style={{color: totalAlertas > 0 ? '#ef4444' : 'inherit'}}>{totalAlertas}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Colhidos</span><div className="icon-box bg-blue-light"><Flag size={20} /></div></div>
                    <div className="kpi-value">{totalColhidos}</div>
                </div>
            </div>

            <div className="cultivos-grid">
                {cultivos.map(cultivo => {
                    const health = getHealthLabel(cultivo.estadoPlanta);
                    return (
                        <div key={cultivo.idCultivo} className="cultivo-card">
                            <div className={`health-indicator ${health.class}`}></div>
                            <div className="cultivo-content">
                                <div className="cultivo-header">
                                    <div>
                                        <span className={`status-badge ${cultivo.statusCultivo === 'ATIVO' ? 'status-ativo' : 'status-colhido'}`}>{cultivo.statusCultivo}</span>
                                        <h3 className="cultivo-title">{cultivo.plantaCultivada?.nomePopular || 'Planta Removida'}</h3>
                                        <p className="cultivo-subtitle">Plantio: {formatarData(cultivo.dataPlantio)}</p>
                                    </div>
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button onClick={() => abrirModal(cultivo)} className="btn-icon-sm" title="Editar"><Pencil size={14}/></button>
                                        <button onClick={() => setConfirmacaoExclusao({aberta: true, id: cultivo.idCultivo})} className="btn-icon-sm danger" title="Excluir"><Trash2 size={14}/></button>
                                    </div>
                                </div>

                                <div className="cultivo-info-row"><health.icon size={14} color={health.color}/> <span style={{color: health.color, fontWeight:600}}>{health.text}</span></div>
                                <div className="cultivo-info-row"><MapPin size={14}/> {cultivo.areaCultivo?.nomeArea || 'Área indefinida'}</div>
                                <div className="cultivo-info-row"><Sprout size={14}/> Qtd: <strong>{cultivo.quantidadePlantada}</strong></div>

                                {cultivo.statusCultivo === 'COLHIDO' && (
                                    <div style={{marginTop:'10px', padding:'8px', background:'#f0fdf4', borderRadius:'8px', border:'1px solid #bbf7d0'}}>
                                        <div className="cultivo-info-row" style={{color:'#15803d'}}><TrendingUp size={14}/> Colhido: {cultivo.quantidadeColhida}</div>
                                        <div className="cultivo-info-row" style={{color:'#15803d', fontSize:'0.8rem'}}><Flag size={14}/> Data: {formatarData(cultivo.dataColheitaFinal)}</div>
                                    </div>
                                )}
                                {cultivo.observacaoCultivo && <div className="cultivo-obs">"{cultivo.observacaoCultivo}"</div>}
                            </div>

                            <div className="cultivo-actions">
                                <button className="btn-action-cultivo water" onClick={() => abrirModalEvento('IRRIGACAO', cultivo)}><Droplets size={18}/> Regar</button>
                                <button className="btn-action-cultivo pest" onClick={() => abrirModalEvento('PRAGA', cultivo)}><Bug size={18}/> Praga</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {modalEventoAberto && (
                <div className="modal-modern-overlay" style={{zIndex: 10002}}>
                    <div className="modal-modern-content" style={{maxWidth: '450px', padding: '1.5rem'}}>
                        <div className="event-modal-header">
                            <div className={`icon-circle-event ${acaoEvento.tipo === 'IRRIGACAO' ? 'bg-water-soft' : 'bg-pest-soft'}`}>
                                {acaoEvento.tipo === 'IRRIGACAO' ? <Droplets size={20}/> : <Bug size={20}/>}
                            </div>
                            <div>
                                <h3 style={{margin:0, fontSize:'1.1rem', fontWeight:700}}>
                                    {acaoEvento.tipo === 'IRRIGACAO' ? 'Registrar Irrigação' : 'Ocorrência de Praga'}
                                </h3>
                                <p style={{margin:0, fontSize:'0.85rem', color:'#64748b'}}>{acaoEvento.nomePlanta}</p>
                            </div>
                            <X size={20} onClick={() => setModalEventoAberto(false)} style={{marginLeft:'auto', cursor:'pointer', color:'#94a3b8'}}/>
                        </div>

                        <form onSubmit={salvarEvento}>
                            {acaoEvento.tipo === 'IRRIGACAO' ? (
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'15px'}}>
                                    <div className="form-group">
                                        <label className="form-label">Volume (L/mm)</label>
                                        <input
                                            type="number" step="0.1"
                                            className={`form-input ${errosCampos.includes('volume') ? 'input-error' : ''}`}
                                            required value={dadosEvento.volume}
                                            onChange={e => setDadosEvento({...dadosEvento, volume: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Método</label>
                                        <select className="form-select" value={dadosEvento.metodo} onChange={e => setDadosEvento({...dadosEvento, metodo: e.target.value})}>
                                            <option value="GOTEJAMENTO">Gotejamento</option>
                                            <option value="ASPERSAO">Aspersão</option>
                                            <option value="MANUAL">Manual</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'15px'}}>
                                    <div className="form-group">
                                        <label className="form-label">Nome da Praga</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errosCampos.includes('nome') ? 'input-error' : ''}`}
                                            required placeholder="Ex: Pulgão"
                                            value={dadosEvento.nome}
                                            onChange={e => setDadosEvento({...dadosEvento, nome: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Severidade</label>
                                        <select className="form-select" value={dadosEvento.nivel} onChange={e => setDadosEvento({...dadosEvento, nivel: e.target.value})}>
                                            <option value="BAIXO">Baixo</option>
                                            <option value="MEDIO">Médio</option>
                                            <option value="ALTO">Alto</option>
                                            <option value="CRITICO">Crítico</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{marginBottom:'15px'}}>
                                <label className="form-label">Data e Hora</label>
                                <input
                                    type="datetime-local"
                                    className={`form-input ${errosCampos.includes('dataHora') ? 'input-error' : ''}`}
                                    required value={dadosEvento.dataHora}
                                    onChange={e => setDadosEvento({...dadosEvento, dataHora: e.target.value})}
                                />
                                {errosCampos.length > 0 && <p className="error-text">Verifique os campos em destaque.</p>}
                            </div>

                            <div className="form-group" style={{marginBottom:'20px'}}>
                                <label className="form-label">Observações adicionais</label>
                                <input className="form-input" placeholder="Opcional..." value={dadosEvento.obs} onChange={e => setDadosEvento({...dadosEvento, obs: e.target.value})} />
                            </div>

                            <div style={{display:'flex', gap:'10px'}}>
                                <button type="button" className="btn-outline" style={{flex:1}} onClick={() => setModalEventoAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{flex:1}} disabled={carregando}>
                                    {carregando ? 'Salvando...' : <><Save size={16} style={{marginRight:8}}/> Salvar Registro</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth: '600px', padding: '1.5rem'}}>
                        <div className="modal-header-flex" style={{marginBottom: '1rem'}}>
                            <h2 className="modal-title">{editandoId ? 'Editar Cultivo' : 'Novo Cultivo'}</h2>
                            <X size={20} onClick={fecharModal} style={{cursor:'pointer'}}/>
                        </div>
                        <form onSubmit={salvarCultivo}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                                {!editandoId && (
                                    <>
                                        <div className="form-group"><label className="form-label">Área</label>
                                            <select className="form-select" value={formCultivo.idArea} onChange={e => setFormCultivo({...formCultivo, idArea: e.target.value})} required>
                                                <option value="">Selecione...</option>{areas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Planta</label>
                                            <select className="form-select" value={formCultivo.idPlanta} onChange={e => setFormCultivo({...formCultivo, idPlanta: e.target.value})} required>
                                                <option value="">Selecione...</option>{plantas.map(p => <option key={p.idPlanta} value={p.idPlanta}>{p.nomePopular}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div className="form-group"><label className="form-label">Qtd Plantada</label><input type="number" className="form-input" value={formCultivo.quantidadePlantada} onChange={e => setFormCultivo({...formCultivo, quantidadePlantada: e.target.value})} required /></div>
                                <div className="form-group"><label className="form-label">Data Plantio</label><input type="date" className="form-input" value={formCultivo.dataPlantio} onChange={e => setFormCultivo({...formCultivo, dataPlantio: e.target.value})} required /></div>
                            </div>

                            {editandoId && (
                                <div style={{marginTop:'12px', padding:'12px', background:'#f8fafc', borderRadius:'10px', border:'1px dashed #cbd5e1'}}>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                                        <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={formCultivo.statusCultivo} onChange={e => setFormCultivo({...formCultivo, statusCultivo: e.target.value})}><option value="ATIVO">Ativo</option><option value="COLHIDO">Colhido</option></select></div>
                                        <div className="form-group"><label className="form-label">Saúde</label><select className="form-select" value={formCultivo.estadoPlanta} onChange={e => setFormCultivo({...formCultivo, estadoPlanta: e.target.value})}><option value="SAUDAVEL">Saudável</option><option value="EM_ATENCAO">Em Atenção</option><option value="COM_PRAGA">Com Praga</option><option value="CRITICO">Crítico</option></select></div>
                                        <div className="form-group"><label className="form-label">Qtd Colhida</label><input type="number" className="form-input" value={formCultivo.quantidadeColhida} onChange={e => setFormCultivo({...formCultivo, quantidadeColhida: e.target.value})}/></div>
                                        <div className="form-group"><label className="form-label">Data Colheita</label><input type="date" className="form-input" value={formCultivo.dataColheitaFinal} onChange={e => setFormCultivo({...formCultivo, dataColheitaFinal: e.target.value})}/></div>
                                    </div>
                                    <div className="form-group" style={{marginTop:'8px'}}><label className="form-label">Observação</label><input className="form-input" value={formCultivo.observacaoCultivo} onChange={e => setFormCultivo({...formCultivo, observacaoCultivo: e.target.value})} /></div>
                                </div>
                            )}

                            <div className="modal-footer" style={{paddingTop: '1rem'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={carregando}>{carregando ? "Salvando..." : "Salvar Alterações"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay" style={{zIndex: 10005}}>
                    <div className="modal-modern-content" style={{maxWidth: '400px', textAlign: 'center'}}>
                        <AlertCircle size={48} color="#dc2626" style={{margin:'0 auto 15px'}}/>
                        <h3 className="modal-title">Remover Cultivo?</h3>
                        <p style={{color:'#64748b', margin:'10px 0 20px'}}>O histórico de irrigação e pragas deste plantio será perdido permanentemente.</p>
                        <div style={{display:'flex', gap:'10px'}}>
                            <button className="btn-outline" style={{flex:1}} onClick={() => setConfirmacaoExclusao({aberta:false})}>Voltar</button>
                            <button className="btn-danger" style={{flex:1}} onClick={executarExclusao}>Confirmar Exclusão</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cultivos;