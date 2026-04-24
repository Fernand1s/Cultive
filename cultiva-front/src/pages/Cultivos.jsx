import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Cultivos.css';
import {
    Trash2, Plus, Calendar, Activity, Pencil, Droplets,
    Bug, Sprout, MapPin, Flag, CheckCircle2, AlertTriangle, X, Save, TrendingUp, Clock, AlertCircle
} from 'lucide-react';

import { useNotify } from "../context/NotificationContext";

import { request, getHeaders, cultivoService, eventoService, userService as service, authService, areaService, plantaService } from '../services/api';

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

    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [historicoEventos, setHistoricoEventos] = useState([]);
    const [cultivoSelecionado, setCultivoSelecionado] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('ATIVO');

    const [formCultivo, setFormCultivo] = useState({
        idArea: '', idPlanta: '', quantidadePlantada: '', dataPlantio: '',
        statusCultivo: 'ATIVO', estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
        quantidadeColhida: '', dataColheitaFinal: ''
    });

    const [modalEventoAberto, setModalEventoAberto] = useState(false);
    const [acaoEvento, setAcaoEvento] = useState(null);
    const [dadosEvento, setDadosEvento] = useState({
        volume: '', metodo: 'GOTEJAMENTO', nome: '', nivel: 'BAIXO', obs: '', dataHora: ''
    });

    // Lógica para calcular a quantidade de itens em cada aba
    const contagem = {
        ATIVO: cultivos.filter(c => c.statusCultivo === 'ATIVO').length,
        EM_PREPARO: cultivos.filter(c => c.statusCultivo === 'EM_PREPARO').length,
        COLHIDO: cultivos.filter(c => c.statusCultivo === 'COLHIDO').length,
        CANCELADO: cultivos.filter(c => c.statusCultivo === 'CANCELADO').length
    };

    // Lógica para filtrar a lista que será exibida no grid
    const cultivosFiltrados = cultivos.filter(cultivo => cultivo.statusCultivo === abaAtiva);

    const [errosCampos, setErrosCampos] = useState([]);

    // --- CARREGAMENTO ---
    const carregarTudo = async () => {
        try {
            setCarregando(true);

            const [dadosAreas, dadosPlantas, dadosCultivos] = await Promise.all([
                areaService.listar(),
                plantaService.listar(),
                cultivoService.listar()
            ]);

            setAreas(dadosAreas || []);
            setPlantas(dadosPlantas || []);
            setCultivos(dadosCultivos || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            notify("Erro ao carregar informações de cultivos.", "error");
        } finally {
            setCarregando(false);
        }
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
                quantidadePlantada: cultivo.quantidadePlantada || '',
                dataPlantio: cultivo.dataPlantio || '',
                statusCultivo: cultivo.statusCultivo || 'ATIVO',
                estadoPlanta: cultivo.estadoPlanta || 'SAUDAVEL',
                observacaoCultivo: cultivo.observacaoCultivo || '',
                quantidadeColhida: cultivo.quantidadeColhida || '',
                dataColheitaFinal: cultivo.dataColheitaFinal || ''
            });
        } else {
            setEditandoId(null);
            setFormCultivo({
                idArea: '', idPlanta: '', quantidadePlantada: '', dataPlantio: '',
                statusCultivo: 'ATIVO', estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
                quantidadeColhida: '', dataColheitaFinal: ''
            });
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); setErrosCampos([]); };

    const salvarCultivo = async (e) => {
        e.preventDefault();
        if (carregando) return;
        setCarregando(true);

        const usuarioLogado = authService.obterUsuarioLogado();

        const payload = {
            idPlanta: parseInt(formCultivo.idPlanta),
            idArea: parseInt(formCultivo.idArea),
            quantidadePlantada: parseFloat(formCultivo.quantidadePlantada),
            dataPlantio: formCultivo.dataPlantio,
            statusCultivo: formCultivo.statusCultivo,
            estadoPlanta: formCultivo.estadoPlanta,
            observacaoCultivo: formCultivo.observacaoCultivo || "",
            quantidadeColhida: formCultivo.statusCultivo === 'COLHIDO' ? parseFloat(formCultivo.quantidadeColhida || 0) : null,
            dataColheitaFinal: formCultivo.statusCultivo === 'COLHIDO' && formCultivo.dataColheitaFinal ? formCultivo.dataColheitaFinal : null
        };

        try {
            if (editandoId) {
                await cultivoService.atualizar(editandoId, payload);
                /*
                await service.registrarLog(
                    "Edição de Cultivo",
                    `Atualizou dados do cultivo ID ${editandoId}`,
                    usuarioLogado.idUsuario || usuarioLogado.id
                );
                */
                notify("Cultivo atualizado!", "success");
            } else {
                await cultivoService.criar(payload);
                /*
                await service.registrarLog(
                    "Novo Cultivo",
                    `Iniciou plantio na área ID ${payload.idArea}`,
                    usuarioLogado.idUsuario || usuarioLogado.id
                );
                */
                notify("Novo cultivo criado!", "success");
            }
            fecharModal();
            carregarTudo();
        } catch (error) {
            notify(error.message || "Erro ao salvar cultivo.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const executarExclusao = async () => {
        try {
            const usuarioLogado = authService.obterUsuarioLogado();
            await cultivoService.excluir(confirmacaoExclusao.id);

            /*
            await service.registrarLog(
                "Exclusão de Cultivo",
                `Removeu o cultivo ID ${confirmacaoExclusao.id}`,
                usuarioLogado.idUsuario || usuarioLogado.id
            );
            */

            carregarTudo();
            notify("Cultivo removido.", "success");
        } catch (error) {
            console.error("Erro ao excluir cultivo:", error);

            const mensagemErro = error.response?.data?.message || "Não foi possível excluir o cultivo. Verifique se ele possui registros vinculados.";
            notify(mensagemErro, "error");
        } finally {
            setConfirmacaoExclusao({ aberta: false, id: null });
        }
    };

    // --- FUNÇÕES EVENTOS (MODAL) ---
    const abrirModalEvento = (tipo, cultivo, eventoParaEditar = null) => {
        setErrosCampos([]);

        setAcaoEvento({
            tipo,
            id: cultivo.idCultivo,
            idEvento: eventoParaEditar ? (eventoParaEditar.idEvento || eventoParaEditar.idIrrigacao || eventoParaEditar.idPraga) : null,
            nomePlanta: cultivo.plantaCultivada?.nomePopular || 'Planta'
        });

        if (eventoParaEditar) {
            setDadosEvento({
                volume: eventoParaEditar.volumeAgua || '',
                metodo: eventoParaEditar.metodo || 'GOTEJAMENTO',
                nome: eventoParaEditar.nomePragaOuDoenca || '',
                nivel: eventoParaEditar.nivelAfetacao || 'BAIXO',
                obs: eventoParaEditar.observacaoEvento || '',
                dataHora: eventoParaEditar.dataHora ? eventoParaEditar.dataHora.slice(0, 16) : new Date().toISOString().slice(0, 16)
            });
        } else {
            setDadosEvento({
                volume: '', metodo: 'GOTEJAMENTO', nome: '', nivel: 'BAIXO',
                obs: '', dataHora: new Date().toISOString().slice(0, 16)
            });
        }
        setModalEventoAberto(true);
    };

    const salvarEvento = async (e) => {
        e.preventDefault();
        if (carregando) return;

        if (acaoEvento.tipo === 'IRRIGACAO' && (!dadosEvento.volume || parseFloat(dadosEvento.volume) <= 0)) {
            notify("O volume de água deve ser maior que 0", "error");
            return;
        }

        setCarregando(true);

        try {
            const usuarioLogado = authService.obterUsuarioLogado();
            const idUserLogado = usuarioLogado?.idUsuario || usuarioLogado?.id;
            const isEdit = !!acaoEvento.idEvento;

            const dataFormatada = dadosEvento.dataHora.length === 16
                ? `${dadosEvento.dataHora}:00`
                : dadosEvento.dataHora;

            const payloadEvento = {
                dataHora: dataFormatada,
                observacao: dadosEvento.obs || "",
                idUsuario: idUserLogado,
                volumeAgua: acaoEvento.tipo === 'IRRIGACAO' ? parseFloat(dadosEvento.volume) : null,
                metodo: acaoEvento.tipo === 'IRRIGACAO' ? dadosEvento.metodo : null,
                nomePraga: acaoEvento.tipo === 'PRAGA' ? dadosEvento.nome : null,
                nivel: acaoEvento.tipo === 'PRAGA' ? dadosEvento.nivel : null
            };

            const servicoTipo = acaoEvento.tipo === 'IRRIGACAO' ? 'irrigacao' : 'praga';
            const apiService = eventoService[servicoTipo];

            if (isEdit) {
                await apiService.atualizar(acaoEvento.idEvento, payloadEvento);
            } else {
                await apiService.registrar(acaoEvento.id, payloadEvento);
            }

            /*
            await service.registrarLog(
                `${isEdit ? 'Edição' : 'Registro'} de ${acaoEvento.tipo}`,
                `${acaoEvento.tipo === 'IRRIGACAO' ? 'Volume: ' + dadosEvento.volume + 'L' : 'Praga: ' + dadosEvento.nome}`,
                idUserLogado
            );
            */

            if (acaoEvento.tipo === 'PRAGA' && !isEdit) {
                const cultivoAtual = cultivos.find(c => c.idCultivo === acaoEvento.id);
                if (cultivoAtual) {
                    const payloadAtualizacao = {
                        ...cultivoAtual,
                        idPlanta: cultivoAtual.plantaCultivada.idPlanta,
                        idArea: cultivoAtual.areaCultivo.idArea,
                        estadoPlanta: 'PRAGA'
                    };
                    await cultivoService.atualizar(acaoEvento.id, payloadAtualizacao);
                }
            }

            notify(isEdit ? "Registro atualizado!" : "Registro salvo com sucesso!", "success");
            setModalEventoAberto(false);
            setModalHistoricoAberto(false);
            carregarTudo();

        } catch (err) {
            console.error("Erro ao processar evento:", err);
            const msg = err.response?.data?.message || "Erro ao registrar: Verifique os dados ou a conexão.";
            notify(msg, "error");
        } finally {
            setCarregando(false);
        }
    };

    const abrirHistorico = async (cultivo) => {
        setCultivoSelecionado(cultivo);
        try {
            const [irrigacoes, pragas] = await Promise.all([
                eventoService.irrigacao.listarPorCultivo(cultivo.idCultivo),
                eventoService.praga.listarPorCultivo(cultivo.idCultivo)
            ]);

            const unificado = [
                ...irrigacoes.map(i => ({ ...i, tipo: 'IRRIGACAO' })),
                ...pragas.map(p => ({ ...p, tipo: 'PRAGA' }))
            ].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

            setHistoricoEventos(unificado);
            setModalHistoricoAberto(true);
        } catch (error) {
            notify("Erro ao carregar histórico.", "error");
        }
    };

    // --- EXCLUIR EVENTO (CANCELAR ERRO) ---
    const excluirEvento = async (idEvento, tipo) => {
        const endpoint = tipo === 'IRRIGACAO' ? 'irrigacao' : 'praga';
        try {
            await eventoService[endpoint].excluir(idEvento);
            notify("Registro removido.", "success");
            abrirHistorico(cultivoSelecionado);
            carregarTudo();
        } catch (error) {
            notify("Erro ao remover registro.", "error");
        }
    };

    // --- RESOLVER PRAGA (MARCAR COMO SAUDÁVEL) ---
    const resolverPraga = async (idPersonalizado = null) => {
        const idParaResolver = idPersonalizado || cultivoSelecionado?.idCultivo;
        const cultivoParaResolver = idPersonalizado
            ? cultivos.find(c => c.idCultivo === idPersonalizado)
            : cultivoSelecionado;

        if (!cultivoParaResolver) return;

        try {
            setCarregando(true);

            const payloadCultivo = {
                ...cultivoParaResolver,
                idPlanta: cultivoParaResolver.plantaCultivada.idPlanta,
                idArea: cultivoParaResolver.areaCultivo.idArea,
                estadoPlanta: 'SAUDAVEL'
            };

            await cultivoService.atualizar(idParaResolver, payloadCultivo);

            notify("Planta recuperada com sucesso!", "success");
            setModalEventoAberto(false);
            setModalHistoricoAberto(false);
            carregarTudo();
        } catch (error) {
            notify("Erro ao atualizar status.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'ATIVO': return { text: 'Em Produção', class: 'status-ativo' };
            case 'COLHIDO': return { text: 'Safra Concluída', class: 'status-colhido' };
            case 'EM_PREPARO': return { text: 'Em Preparo', class: 'status-preparo' };
            case 'CANCELADO': return { text: 'Cancelado', class: 'status-cancelado' };
            default: return { text: status, class: '' };
        }
    };

    const getHealthLabel = (health) => {
        switch(health) {
            case 'SAUDAVEL': return { icon: CheckCircle2, text: 'Saudável', color: '#16a34a', class: 'health-saudavel' };
            case 'EM_ATENCAO': return { icon: AlertTriangle, text: 'Atenção', color: '#eab308', class: 'health-atencao' };
            case 'PRAGA': return { icon: Bug, text: 'Com Praga', color: '#f97316', class: 'health-atencao' };
            case 'CRITICO': return { icon: Activity, text: 'Crítico', color: '#ef4444', class: 'health-critico' };
            default: return { icon: Activity, text: health, color: '#64748b', class: '' };
        }
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

            {/* KPIs ORIGINAIS */}
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

            {/* BARRA DE NAVEGAÇÃO POR ABAS */}
            <div className="tabs-container">
                <button className={`tab-item ${abaAtiva === 'ATIVO' ? 'active' : ''}`} onClick={() => setAbaAtiva('ATIVO')}>
                    <Activity size={18} /> Ativos <span className="tab-count">{contagem.ATIVO}</span>
                </button>
                <button className={`tab-item ${abaAtiva === 'EM_PREPARO' ? 'active' : ''}`} onClick={() => setAbaAtiva('EM_PREPARO')}>
                    <Clock size={18} /> Em Preparo <span className="tab-count">{contagem.EM_PREPARO}</span>
                </button>
                <button className={`tab-item ${abaAtiva === 'COLHIDO' ? 'active' : ''}`} onClick={() => setAbaAtiva('COLHIDO')}>
                    <CheckCircle2 size={18} /> Colhidos <span className="tab-count">{contagem.COLHIDO}</span>
                </button>
                <button className={`tab-item ${abaAtiva === 'CANCELADO' ? 'active' : ''}`} onClick={() => setAbaAtiva('CANCELADO')}>
                    <X size={18} /> Cancelados <span className="tab-count">{contagem.CANCELADO}</span>
                </button>
            </div>

            {/* GRID DE CULTIVOS FILTRADOS */}
            <div className="cultivos-grid">
                {cultivosFiltrados.length > 0 ? (
                    cultivosFiltrados.map(cultivo => {
                        const health = getHealthLabel(cultivo.estadoPlanta);
                        const statusInfo = getStatusLabel(cultivo.statusCultivo);
                        const isAtivo = cultivo.statusCultivo === 'ATIVO';
                        const isColhido = cultivo.statusCultivo === 'COLHIDO';
                        const isFinalizado = isColhido || cultivo.statusCultivo === 'CANCELADO';

                        return (
                            <div key={cultivo.idCultivo} className={`cultivo-card ${isFinalizado ? 'card-finalizado' : ''}`}>
                                <div className={`health-indicator ${isFinalizado ? 'health-colhido' : health.class}`}></div>
                                <div className="cultivo-content">
                                    <div className="cultivo-header">
                                        <div className="cultivo-title-box">                                           
                                            <div>
                                                <h3 className="cultivo-title">{cultivo.plantaCultivada?.nomePopular || 'Planta Removida'}</h3>
                                                <p className="cultivo-subtitle">Plantio: {formatarData(cultivo.dataPlantio)}</p>
                                            </div>  
                                            <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>                    
                                        </div>
                                        {/** 
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button onClick={() => abrirModal(cultivo)} className="btn-icon-sm" title="Editar"><Pencil size={14}/></button>
                                            <button onClick={() => setConfirmacaoExclusao({aberta: true, id: cultivo.idCultivo})} className="btn-icon-sm danger" title="Excluir"><Trash2 size={14}/></button>
                                        </div>
                                        */}
                                    </div>

                                    {!isFinalizado ? (
                                        <div className="cultivo-info-row">
                                            <health.icon size={14} color={health.color}/>
                                            <span style={{color: health.color, fontWeight:600}}>{health.text}</span>
                                        </div>
                                    ) : (
                                        <div className="cultivo-info-row" style={{color: isColhido ? '#1e40af' : '#64748b'}}>
                                            {isColhido ? <CheckCircle2 size={14}/> : <X size={14}/>}
                                            <strong>{isColhido ? 'Ciclo Finalizado' : 'Cultivo Cancelado'}</strong>
                                        </div>
                                    )}

                                    <div className="cultivo-info-row"><MapPin size={14}/> {cultivo.areaCultivo?.nomeArea || 'Área indefinida'}</div>

                                    {isColhido ? (
                                        <div className="resumo-colheita-box animate-pop-in">
                                            <div className="colheita-stat">
                                                <TrendingUp size={16}/>
                                                <div><span>Total Colhido</span><strong>{cultivo.quantidadeColhida} unidades</strong></div>
                                            </div>
                                            <div className="colheita-stat">
                                                <Calendar size={16}/>
                                                <div><span>Data da Colheita</span><strong>{formatarData(cultivo.dataColheitaFinal)}</strong></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="cultivo-info-row">
                                            <Sprout size={14}/> Qtd Atual: <strong>{cultivo.quantidadePlantada}</strong>
                                        </div>
                                    )}
                                </div>

                                {!isFinalizado && (
                                    <div className="cultivo-actions">
                                        {/** 
                                        <button
                                            className="btn-action-cultivo water"
                                            onClick={() => abrirModalEvento('IRRIGACAO', cultivo)}
                                            disabled={!isAtivo}
                                            style={{ opacity: isAtivo ? 1 : 0.5 }}
                                        >
                                            <Droplets size={18}/> Regar
                                        </button>*/}

                                        <button
                                            className={`btn-action-cultivo ${cultivo.estadoPlanta === 'PRAGA' ? 'pest-active' : 'pest'}`}
                                            onClick={() => abrirModalEvento('PRAGA', cultivo)}
                                            disabled={!isAtivo}
                                            style={{ opacity: isAtivo ? 1 : 0.5 }}
                                        >
                                            <Bug size={18}/> {cultivo.estadoPlanta === 'PRAGA' ? 'Ver Praga' : 'Praga'}
                                        </button>

                                        <button className="btn-icon-sm" onClick={() => abrirHistorico(cultivo)}>
                                            <Clock size={18}/>
                                        </button>

                                        <button className="btn-icon-sm"  onClick={() => abrirModal(cultivo)} title="Editar"><Pencil size={18}/>
                                        </button>

                                        <button className="btn-icon-sm" onClick={() => setConfirmacaoExclusao({aberta: true, id: cultivo.idCultivo})}  title="Excluir"><Trash2 size={18}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <p>Nenhum cultivo encontrado nesta categoria.</p>
                    </div>
                )}
            </div>

            {/* MODAL DE REGISTRO DE EVENTO (IRRIGAÇÃO/PRAGA) */}
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
                                        <input type="number" step="0.1" className="form-input" required value={dadosEvento.volume} onChange={e => setDadosEvento({...dadosEvento, volume: e.target.value})} />
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
                                        <input type="text" className="form-input" required placeholder="Ex: Pulgão" value={dadosEvento.nome} onChange={e => setDadosEvento({...dadosEvento, nome: e.target.value})} />
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
                                <input type="datetime-local" className="form-input" required value={dadosEvento.dataHora} onChange={e => setDadosEvento({...dadosEvento, dataHora: e.target.value})} />
                            </div>

                            <div className="form-group" style={{marginBottom:'20px'}}>
                                <label className="form-label">Observações adicionais</label>
                                <input className="form-input" placeholder="Opcional..." value={dadosEvento.obs} onChange={e => setDadosEvento({...dadosEvento, obs: e.target.value})} />
                            </div>

                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button type="button" className="btn-outline" style={{flex:1}} onClick={() => setModalEventoAberto(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary" style={{flex:2}} disabled={carregando}>
                                        {carregando ? 'Salvando...' : <><Save size={16} style={{marginRight:8}}/> {acaoEvento?.idEvento ? 'Atualizar' : 'Salvar Registro'}</>}
                                    </button>
                                </div>

                                {/* BOTÃO RESOLVER DENTRO DO FORM DE PRAGA */}
                                {acaoEvento.tipo === 'PRAGA' && cultivos.find(c => c.idCultivo === acaoEvento.id)?.estadoPlanta === 'PRAGA' && (
                                    <button type="button" className="btn-action-cultivo" style={{background: '#16a34a', color: 'white', width: '100%'}} onClick={() => resolverPraga(acaoEvento.id)}>
                                        <CheckCircle2 size={18} style={{marginRight: 8}}/> Marcar como Resolvida
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE EDIÇÃO DE CULTIVO */}
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
                                        <div className="form-group">
                                            <label className="form-label">Área</label>
                                            <select className="form-select" value={formCultivo.idArea} onChange={e => setFormCultivo({...formCultivo, idArea: e.target.value})} required>
                                                <option value="">Selecione a área...</option>
                                                {areas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
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
                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                value={formCultivo.statusCultivo}
                                                onChange={e => setFormCultivo({...formCultivo, statusCultivo: e.target.value})}
                                            >
                                                <option value="ATIVO">Ativo</option>
                                                <option value="EM_PREPARO">Em Preparo</option>
                                                <option value="COLHIDO">Colhido</option>
                                                <option value="CANCELADO">Cancelado</option> {/* AGORA SIM NO LUGAR CERTO */}
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Saúde</label><select className="form-select" value={formCultivo.estadoPlanta} onChange={e => setFormCultivo({...formCultivo, estadoPlanta: e.target.value})}><option value="SAUDAVEL">Saudável</option><option value="EM_ATENCAO">Em Atenção</option><option value="PRAGA">Com Praga</option><option value="CRITICO">Crítico</option></select></div>
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

            {/* CONFIRMAÇÃO DE EXCLUSÃO */}
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

            {/* MODAL DE HISTÓRICO ATUALIZADO */}
            {modalHistoricoAberto && (
                <div className="modal-modern-overlay" style={{ zIndex: 10001 }}>
                    <div className="modal-modern-content" style={{ maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header-flex" style={{ paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                            <div>
                                <h2 className="modal-title">Histórico de Manejo</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    {cultivoSelecionado?.plantaCultivada?.nomePopular} - {cultivoSelecionado?.areaCultivo?.nomeArea}
                                </p>
                            </div>
                            <X size={20} onClick={() => setModalHistoricoAberto(false)} style={{ cursor: 'pointer' }} />
                        </div>

                        <div className="modal-historico-body" style={{ flex: 1 }}>
                            {historicoEventos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    <Clock size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                                    <p>Nenhuma atividade registrada.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {historicoEventos.map((ev, idx) => (
                                        <div key={idx} className={`historico-item ${ev.tipo === 'IRRIGACAO' ? 'irrigacao' : 'praga'}`}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {ev.tipo === 'IRRIGACAO' ? <Droplets size={16} color="#0284c7" /> : <Bug size={16} color="#ea580c" />}
                                                    <strong style={{ fontSize: '0.9rem' }}>
                                                        {ev.tipo === 'IRRIGACAO' ? `${ev.volumeAgua}L - ${ev.metodo}` : ev.nomePragaOuDoenca}
                                                    </strong>
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => abrirModalEvento(ev.tipo, cultivoSelecionado, ev)} className="btn-icon-sm" style={{width:24, height:24}}><Pencil size={12}/></button>
                                                    <button onClick={() => excluirEvento(ev.idEvento || ev.idIrrigacao || ev.idPraga, ev.tipo)} className="btn-icon-sm danger" style={{width:24, height:24}}><Trash2 size={12}/></button>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                {new Date(ev.dataHora).toLocaleString('pt-BR')}
                                            </div>

                                            {ev.observacaoEvento && (
                                                <p style={{ fontSize: '0.8rem', marginTop: '6px', color: '#475569', fontStyle: 'italic' }}>
                                                    "{ev.observacaoEvento}"
                                                </p>
                                            )}

                                            {/* Badge de Resolvido Visual no histórico */}
                                            {ev.tipo === 'PRAGA' && cultivoSelecionado.estadoPlanta === 'SAUDAVEL' && idx === 0 && (
                                                <div className="badge-resolvido-historico">
                                                    <CheckCircle2 size={12}/> OCORRÊNCIA ENCERRADA
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botão de resolver no rodapé do histórico */}
                        {cultivoSelecionado?.estadoPlanta === 'PRAGA' && (
                            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0', marginTop: '10px' }}>
                                <button className="btn-action-cultivo" style={{ background: '#16a34a', color: 'white', width: '100%' }} onClick={() => resolverPraga()}>
                                    <CheckCircle2 size={18} style={{ marginRight: 8 }} /> Resolver Problema Agora
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cultivos;