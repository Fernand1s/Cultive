import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Cultivos.css';
import {
    Trash2, Plus, Calendar, Activity, Pencil, Droplets,
    Bug, Sprout, MapPin, Flag, CheckCircle2, AlertTriangle,
    X, Save, TrendingUp, Clock, AlertCircle, RefreshCw,
    Scissors, Package, Camera, ChevronDown, History
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";
import { cultivoService, eventoService, userService as service, authService, areaService, plantaService, estoqueService } from '../services/api';

// ── Compressão de imagem (igual às demais páginas) ────────────────
const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 900;
            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
    };
});

const UNIDADES = ['Unidades', 'kg', 'g', 'ton', 'L', 'mL', 'cx', 'sacas', 'mudas'];

const Cultivos = () => {
    const notify = useNotify();

    // ── Dados ─────────────────────────────────────────────────────
    const [cultivos, setCultivos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [plantas, setPlantas] = useState([]);
    const [estoqueInsumos, setEstoqueInsumos] = useState([]);
    const [carregando, setCarregando] = useState(false);

    // ── Abas ──────────────────────────────────────────────────────
    const [abaAtiva, setAbaAtiva] = useState('ATIVO');

    // ── Modal Cadastro / Edição ───────────────────────────────────
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formCultivo, setFormCultivo] = useState({
        idArea: '', idPlanta: '', quantidadePlantada: '', unidadeMedida: 'Unidades',
        dataPlantio: '', tipoCiclo: 'UNICO', statusCultivo: 'ATIVO',
        estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
    });

    // ── Modal Eventos (praga/irrigação) ───────────────────────────
    const [modalEventoAberto, setModalEventoAberto] = useState(false);
    const [acaoEvento, setAcaoEvento] = useState(null);
    const [dadosEvento, setDadosEvento] = useState({
        volume: '', metodo: 'GOTEJAMENTO', nome: '', nivel: 'BAIXO', obs: '',
        dataHora: new Date().toISOString().slice(0, 16), acaoControle: ''
    });

    // ── Modal Colheita ────────────────────────────────────────────
    const [modalColheitaAberto, setModalColheitaAberto] = useState(false);
    const [cultivoColhendo, setCultivoColhendo] = useState(null);
    const [colheitaForm, setColheitaForm] = useState({
        quantidadeColhida: '', unidadeMedida: 'kg',
        dataHora: new Date().toISOString().slice(0, 16),
        observacao: '', fotoColheita: null, insumosUsados: []
    });
    const [insumoSel, setInsumoSel] = useState('');
    const [qtdInsumo, setQtdInsumo] = useState(1);

    // ── Modal Encerrar Safra ──────────────────────────────────────
    const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);
    const [cultivoEncerrando, setCultivoEncerrando] = useState(null);
    const [encerrarForm, setEncerrarForm] = useState({
        dataEncerramento: new Date().toISOString().slice(0, 10),
        motivoEncerramento: ''
    });

    // ── Modal Histórico ───────────────────────────────────────────
    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [historicoEventos, setHistoricoEventos] = useState([]);
    const [cultivoSelecionado, setCultivoSelecionado] = useState(null);

    // ── Confirmação exclusão ──────────────────────────────────────
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null });

    // ── Contagens por aba ─────────────────────────────────────────
    const contagem = {
        EM_PREPARO:  cultivos.filter(c => c.statusCultivo === 'EM_PREPARO').length,
        ATIVO:       cultivos.filter(c => c.statusCultivo === 'ATIVO').length,
        EM_PRODUCAO: cultivos.filter(c => c.statusCultivo === 'EM_PRODUCAO').length,
        ENCERRADO:   cultivos.filter(c => ['COLHIDO','CANCELADO'].includes(c.statusCultivo)).length,
    };

    const cultivosFiltrados = cultivos.filter(c => {
        if (abaAtiva === 'ENCERRADO') return ['COLHIDO','CANCELADO'].includes(c.statusCultivo);
        return c.statusCultivo === abaAtiva;
    });

    // ── Carregamento ──────────────────────────────────────────────
    const carregarTudo = async () => {
        setCarregando(true);
        try {
            const [dadosAreas, dadosPlantas, dadosCultivos, dadosEstoque] = await Promise.all([
                areaService.listar(),
                plantaService.listar(),
                cultivoService.listar(),
                estoqueService.listar().catch(() => [])
            ]);
            setAreas(dadosAreas || []);
            setPlantas(dadosPlantas || []);
            setCultivos(dadosCultivos || []);
            setEstoqueInsumos((dadosEstoque || []).filter(e => e.categoria === 'INSUMO' && (e.quantidadeEstoque ?? 0) > 0));
        } catch {
            notify("Erro ao carregar cultivos.", "error");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => { carregarTudo(); }, []);

    // ── KPIs ──────────────────────────────────────────────────────
    const totalAtivos = cultivos.filter(c => ['ATIVO','EM_PRODUCAO'].includes(c.statusCultivo)).length;
    const totalAlertas = cultivos.filter(c => ['ATIVO','EM_PRODUCAO'].includes(c.statusCultivo) && c.estadoPlanta !== 'SAUDAVEL').length;
    const totalEncerrados = cultivos.filter(c => c.statusCultivo === 'COLHIDO').length;

    // ── Helpers visuais ───────────────────────────────────────────
    const getHealthLabel = (h) => {
        switch(h) {
            case 'SAUDAVEL':   return { icon: CheckCircle2, text:'Saudável',  color:'#16a34a', cls:'health-saudavel'  };
            case 'ATENCAO':    return { icon: AlertTriangle,text:'Atenção',   color:'#eab308', cls:'health-atencao'   };
            case 'PRAGA':      return { icon: Bug,          text:'Com Praga', color:'#f97316', cls:'health-atencao'   };
            case 'CRITICO':    return { icon: Activity,     text:'Crítico',   color:'#ef4444', cls:'health-critico'   };
            default:           return { icon: Activity,     text: h,          color:'#64748b', cls:''                 };
        }
    };

    const getStatusLabel = (s) => {
        switch(s) {
            case 'ATIVO':        return { text:'Em Crescimento', cls:'status-ativo'    };
            case 'EM_PRODUCAO':  return { text:'Em Produção',    cls:'status-producao' };
            case 'EM_PREPARO':   return { text:'Em Preparo',     cls:'status-preparo'  };
            case 'COLHIDO':      return { text:'Encerrado',      cls:'status-colhido'  };
            case 'CANCELADO':    return { text:'Cancelado',      cls:'status-cancelado'};
            default:             return { text: s,               cls:''                };
        }
    };

    const formatarData = (ds) => ds ? ds.split('-').reverse().join('/') : '--/--/----';

    const produtividadeKg = (cultivo) => {
        const area = cultivo.areaCultivo?.tamanhoArea;
        if (!area || !cultivo.quantidadeColhida) return null;
        return (cultivo.quantidadeColhida / area).toFixed(1);
    };

    // ── Abrir / salvar modal de cadastro ──────────────────────────
    const abrirModal = (cultivo = null) => {
        if (cultivo) {
            setEditandoId(cultivo.idCultivo);
            setFormCultivo({
                idArea: cultivo.areaCultivo?.idArea || '',
                idPlanta: cultivo.plantaCultivada?.idPlanta || '',
                quantidadePlantada: cultivo.quantidadePlantada || '',
                unidadeMedida: cultivo.unidadeMedida || 'Unidades',
                dataPlantio: cultivo.dataPlantio || '',
                tipoCiclo: cultivo.tipoCiclo || 'UNICO',
                statusCultivo: cultivo.statusCultivo || 'ATIVO',
                estadoPlanta: cultivo.estadoPlanta || 'SAUDAVEL',
                observacaoCultivo: cultivo.observacaoCultivo || '',
            });
        } else {
            setEditandoId(null);
            setFormCultivo({
                idArea: '', idPlanta: '', quantidadePlantada: '', unidadeMedida: 'Unidades',
                dataPlantio: '', tipoCiclo: 'UNICO', statusCultivo: 'ATIVO',
                estadoPlanta: 'SAUDAVEL', observacaoCultivo: '',
            });
        }
        setModalAberto(true);
    };

    const fecharModal = () => { setModalAberto(false); setEditandoId(null); };

    const salvarCultivo = async (e) => {
        e.preventDefault();
        if (carregando) return;
        setCarregando(true);
        const payload = {
            idPlanta: parseInt(formCultivo.idPlanta),
            idArea: parseInt(formCultivo.idArea),
            quantidadePlantada: parseFloat(formCultivo.quantidadePlantada),
            unidadeMedida: formCultivo.unidadeMedida,
            dataPlantio: formCultivo.dataPlantio,
            tipoCiclo: formCultivo.tipoCiclo,
            statusCultivo: formCultivo.statusCultivo,
            estadoPlanta: formCultivo.estadoPlanta,
            observacaoCultivo: formCultivo.observacaoCultivo || '',
        };
        try {
            if (editandoId) {
                await cultivoService.atualizar(editandoId, payload);
                notify("Cultivo atualizado!", "success");
            } else {
                await cultivoService.criar(payload);
                notify("Cultivo criado!", "success");
            }
            fecharModal();
            carregarTudo();
        } catch (err) {
            notify(err.message || "Erro ao salvar.", "error");
        } finally {
            setCarregando(false);
        }
    };

    // ── Eventos (praga / irrigação) ───────────────────────────────
    const abrirModalEvento = (tipo, cultivo) => {
        setAcaoEvento({ tipo, id: cultivo.idCultivo, nomePlanta: cultivo.plantaCultivada?.nomePopular || 'Planta' });
        setDadosEvento({ volume:'', metodo:'GOTEJAMENTO', nome:'', nivel:'BAIXO', obs:'', acaoControle:'',
                         dataHora: new Date().toISOString().slice(0, 16) });
        setModalEventoAberto(true);
    };

    const salvarEvento = async (e) => {
        e.preventDefault();
        if (carregando) return;
        if (acaoEvento.tipo === 'IRRIGACAO' && (!dadosEvento.volume || parseFloat(dadosEvento.volume) <= 0)) {
            notify("Volume deve ser maior que 0", "error"); return;
        }
        setCarregando(true);
        try {
            const usuarioLogado = authService.obterUsuarioLogado();
            const idUser = usuarioLogado?.idUsuario || usuarioLogado?.id;
            const dataFormatada = dadosEvento.dataHora.length === 16 ? `${dadosEvento.dataHora}:00` : dadosEvento.dataHora;
            const payload = {
                dataHora: dataFormatada, observacao: dadosEvento.obs || '', idUsuario: idUser,
                volumeAgua: acaoEvento.tipo === 'IRRIGACAO' ? parseFloat(dadosEvento.volume) : null,
                metodo: acaoEvento.tipo === 'IRRIGACAO' ? dadosEvento.metodo : null,
                nomePraga: acaoEvento.tipo === 'PRAGA' ? dadosEvento.nome : null,
                nivel: acaoEvento.tipo === 'PRAGA' ? dadosEvento.nivel : null,
            };
            const apiSvc = eventoService[acaoEvento.tipo === 'IRRIGACAO' ? 'irrigacao' : 'praga'];
            await apiSvc.registrar(acaoEvento.id, payload);

            if (acaoEvento.tipo === 'PRAGA') {
                const cultivoAtual = cultivos.find(c => c.idCultivo === acaoEvento.id);
                if (cultivoAtual) {
                    await cultivoService.atualizar(acaoEvento.id, {
                        ...cultivoAtual,
                        idPlanta: cultivoAtual.plantaCultivada.idPlanta,
                        idArea: cultivoAtual.areaCultivo.idArea,
                        estadoPlanta: 'PRAGA'
                    });
                }
            }
            notify("Registro salvo!", "success");
            setModalEventoAberto(false);
            carregarTudo();
        } catch (err) {
            notify(err.message || "Erro ao registrar.", "error");
        } finally {
            setCarregando(false);
        }
    };

    // ── Resolver praga ────────────────────────────────────────────
    const resolverPraga = async (idCultivo, acaoAdotada) => {
        const cultivoAtual = cultivos.find(c => c.idCultivo === idCultivo);
        if (!cultivoAtual) return;
        setCarregando(true);
        try {
            await cultivoService.atualizar(idCultivo, {
                ...cultivoAtual,
                idPlanta: cultivoAtual.plantaCultivada.idPlanta,
                idArea: cultivoAtual.areaCultivo.idArea,
                estadoPlanta: 'SAUDAVEL',
                observacaoCultivo: acaoAdotada || cultivoAtual.observacaoCultivo,
            });
            notify("Praga resolvida!", "success");
            setModalEventoAberto(false);
            setModalHistoricoAberto(false);
            carregarTudo();
        } catch { notify("Erro ao atualizar.", "error"); }
        finally { setCarregando(false); }
    };

    // ── Colheita ─────────────────────────────────────────────────
    const abrirColheita = (cultivo) => {
        setCultivoColhendo(cultivo);
        setColheitaForm({
            quantidadeColhida: '', unidadeMedida: cultivo.unidadeMedida || 'kg',
            dataHora: new Date().toISOString().slice(0, 16),
            observacao: '', fotoColheita: null, insumosUsados: []
        });
        setInsumoSel('');
        setQtdInsumo(1);
        setModalColheitaAberto(true);
    };

    const adicionarInsumo = () => {
        if (!insumoSel) return;
        const item = estoqueInsumos.find(e => String(e.idEstoque) === String(insumoSel));
        if (!item) return;
        if (colheitaForm.insumosUsados.some(i => i.idEstoque === item.idEstoque)) {
            notify("Insumo já adicionado.", "error"); return;
        }
        setColheitaForm(prev => ({
            ...prev,
            insumosUsados: [...prev.insumosUsados, {
                idEstoque: item.idEstoque, nome: item.nome,
                quantidade: qtdInsumo, unidadeMedida: item.unidadeMedida || 'un'
            }]
        }));
        setInsumoSel('');
        setQtdInsumo(1);
    };

    const removerInsumo = (idEstoque) => {
        setColheitaForm(prev => ({ ...prev, insumosUsados: prev.insumosUsados.filter(i => i.idEstoque !== idEstoque) }));
    };

    const handleFotoColheita = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setColheitaForm(prev => ({ ...prev, fotoColheita: compressed }));
        } catch { notify("Erro ao processar imagem.", "error"); }
        e.target.value = '';
    };

    const submeterColheita = async (e) => {
        e.preventDefault();
        if (carregando || !cultivoColhendo) return;
        if (!colheitaForm.quantidadeColhida || parseFloat(colheitaForm.quantidadeColhida) <= 0) {
            notify("Informe a quantidade colhida.", "error"); return;
        }
        setCarregando(true);
        try {
            await cultivoService.registrarColheita(cultivoColhendo.idCultivo, {
                quantidadeColhida: parseFloat(colheitaForm.quantidadeColhida),
                unidadeMedida: colheitaForm.unidadeMedida,
                dataHora: colheitaForm.dataHora.length === 16 ? `${colheitaForm.dataHora}:00` : colheitaForm.dataHora,
                observacao: colheitaForm.observacao,
                fotoColheita: colheitaForm.fotoColheita,
                insumosUsados: colheitaForm.insumosUsados,
            });
            notify("Colheita registrada!", "success");
            setModalColheitaAberto(false);
            carregarTudo();
        } catch (err) {
            notify(err.message || "Erro ao registrar colheita.", "error");
        } finally {
            setCarregando(false);
        }
    };

    // ── Encerrar safra ────────────────────────────────────────────
    const abrirEncerrar = (cultivo) => {
        setCultivoEncerrando(cultivo);
        setEncerrarForm({ dataEncerramento: new Date().toISOString().slice(0, 10), motivoEncerramento: '' });
        setModalEncerrarAberto(true);
    };

    const submeterEncerramento = async (e) => {
        e.preventDefault();
        if (carregando || !cultivoEncerrando) return;
        setCarregando(true);
        try {
            await cultivoService.encerrar(cultivoEncerrando.idCultivo, encerrarForm);
            notify("Safra encerrada!", "success");
            setModalEncerrarAberto(false);
            carregarTudo();
        } catch (err) {
            notify(err.message || "Erro ao encerrar.", "error");
        } finally {
            setCarregando(false);
        }
    };

    // ── Histórico ─────────────────────────────────────────────────
    const abrirHistorico = async (cultivo) => {
        setCultivoSelecionado(cultivo);
        try {
            const [irrigacoes, pragas, colheitas] = await Promise.all([
                eventoService.irrigacao.listarPorCultivo(cultivo.idCultivo),
                eventoService.praga.listarPorCultivo(cultivo.idCultivo),
                cultivoService.listarColheitas(cultivo.idCultivo).catch(() => [])
            ]);
            const unificado = [
                ...irrigacoes.map(i => ({ ...i, tipo: 'IRRIGACAO' })),
                ...pragas.map(p => ({ ...p, tipo: 'PRAGA' })),
                ...colheitas.map(c => ({ ...c, tipo: 'COLHEITA' }))
            ].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
            setHistoricoEventos(unificado);
            setModalHistoricoAberto(true);
        } catch { notify("Erro ao carregar histórico.", "error"); }
    };

    const excluirEvento = async (idEvento, tipo) => {
        const endpoint = tipo === 'IRRIGACAO' ? 'irrigacao' : 'praga';
        try {
            await eventoService[endpoint].excluir(idEvento);
            notify("Registro removido.", "success");
            abrirHistorico(cultivoSelecionado);
            carregarTudo();
        } catch { notify("Erro ao remover.", "error"); }
    };

    const executarExclusao = async () => {
        try {
            await cultivoService.excluir(confirmacaoExclusao.id);
            carregarTudo();
            notify("Cultivo removido.", "success");
        } catch (err) {
            notify(err.message || "Erro ao excluir.", "error");
        } finally {
            setConfirmacaoExclusao({ aberta: false, id: null });
        }
    };

    // ── Áreas disponíveis (sem cultivo ativo) ────────────────────
    const areasOcupadas = new Set(
        cultivos
            .filter(c => ['ATIVO','EM_PRODUCAO','EM_PREPARO'].includes(c.statusCultivo))
            .map(c => c.areaCultivo?.idArea)
    );
    const areasDisponiveis = areas.filter(a => !areasOcupadas.has(a.idArea));

    return (
        <div className="main-content animate-fade-in">
            {/* ── HEADER ──────────────────────────────────────── */}
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Controle de Cultivos</h1>
                    <p className="dashboard-subtitle">Gestão fitotécnica e monitoramento de safra.</p>
                </div>
                <button className="botao-ver" onClick={() => abrirModal()}>
                    <Plus size={20}/> Novo Cultivo
                </button>
            </div>

            {/* ── KPIs ────────────────────────────────────────── */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Cultivos Ativos</span><div className="icon-box bg-green-light"><Sprout size={20}/></div></div>
                    <div className="kpi-value">{totalAtivos}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Alertas de Saúde</span><div className="icon-box bg-red-light"><Activity size={20}/></div></div>
                    <div className="kpi-value" style={{color: totalAlertas > 0 ? '#ef4444' : 'inherit'}}>{totalAlertas}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header"><span className="kpi-title">Safras Encerradas</span><div className="icon-box bg-blue-light"><Flag size={20}/></div></div>
                    <div className="kpi-value">{totalEncerrados}</div>
                </div>
            </div>

            {/* ── ABAS ────────────────────────────────────────── */}
            <div className="tabs-container">
                {[
                    { key:'EM_PREPARO',  label:'Em Preparo',      Icon: Clock          },
                    { key:'ATIVO',       label:'Em Crescimento',  Icon: Sprout         },
                    { key:'EM_PRODUCAO', label:'Em Produção',     Icon: TrendingUp     },
                    { key:'ENCERRADO',   label:'Encerrados',      Icon: CheckCircle2   },
                ].map(({ key, label, Icon }) => (
                    <button key={key} className={`tab-item ${abaAtiva === key ? 'active' : ''}`} onClick={() => setAbaAtiva(key)}>
                        <Icon size={16}/> {label} <span className="tab-count">{contagem[key]}</span>
                    </button>
                ))}
            </div>

            {/* ── GRID DE CARDS ───────────────────────────────── */}
            <div className="cultivos-grid">
                {cultivosFiltrados.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48}/>
                        <p>Nenhum cultivo nesta categoria.</p>
                    </div>
                ) : cultivosFiltrados.map(cultivo => {
                    const health = getHealthLabel(cultivo.estadoPlanta);
                    const statusInfo = getStatusLabel(cultivo.statusCultivo);
                    const isAtivo = ['ATIVO','EM_PRODUCAO'].includes(cultivo.statusCultivo);
                    const isFinalizado = ['COLHIDO','CANCELADO'].includes(cultivo.statusCultivo);
                    const HealthIcon = health.icon;
                    const prod = produtividadeKg(cultivo);
                    const cicloLabel = cultivo.tipoCiclo === 'CONTINUO' ? 'Ciclo Contínuo' : 'Ciclo Único';

                    return (
                        <div key={cultivo.idCultivo} className={`cultivo-card ${isFinalizado ? 'card-finalizado' : ''}`}>
                            <div className={`health-indicator ${isFinalizado ? 'health-colhido' : health.cls}`}/>

                            <div className="cultivo-content">
                                <div className="cultivo-header">
                                    <div className="cultivo-title-box">
                                        <div>
                                            <h3 className="cultivo-title">{cultivo.plantaCultivada?.nomePopular || 'Planta Removida'}</h3>
                                            <p className="cultivo-subtitle">Plantio: {formatarData(cultivo.dataPlantio)}</p>
                                        </div>
                                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                                            <span className={`status-badge ${statusInfo.cls}`}>{statusInfo.text}</span>
                                            <span className="ciclo-badge">{cicloLabel}</span>
                                        </div>
                                    </div>
                                </div>

                                {isAtivo && (
                                    <div className="cultivo-info-row">
                                        <HealthIcon size={14} color={health.color}/>
                                        <span style={{color:health.color,fontWeight:600}}>{health.text}</span>
                                    </div>
                                )}

                                {cultivo.statusCultivo === 'EM_PRODUCAO' && cultivo.tipoCiclo === 'CONTINUO' && (
                                    <div style={{
                                        background:'#fffbeb', border:'1px solid #fde68a',
                                        borderRadius:'8px', padding:'6px 10px',
                                        fontSize:'0.75rem', color:'#92400e',
                                        display:'flex', alignItems:'center', gap:'6px', marginTop:'4px'
                                    }}>
                                        <Flag size={12} color="#f59e0b"/>
                                        Colheitas em andamento — encerre a safra quando finalizar
                                    </div>
                                )}

                                <div className="cultivo-info-row"><MapPin size={13}/> {cultivo.areaCultivo?.nomeArea || '—'}</div>

                                {/* Somatório de colheitas */}
                                {cultivo.quantidadeColhida > 0 && (
                                    <div className="resumo-colheita-box">
                                        <div className="colheita-stat">
                                            <TrendingUp size={15}/>
                                            <div>
                                                <span>Total Colhido</span>
                                                <strong>{cultivo.quantidadeColhida} {cultivo.unidadeMedida || 'un'}</strong>
                                            </div>
                                        </div>
                                        {prod && (
                                            <div className="colheita-stat">
                                                <Activity size={15}/>
                                                <div>
                                                    <span>Produtividade</span>
                                                    <strong>{prod} {cultivo.unidadeMedida}/ha</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isFinalizado && cultivo.dataColheitaFinal && (
                                    <div className="cultivo-info-row" style={{color:'#64748b',fontSize:'0.8rem'}}>
                                        <Calendar size={13}/> Encerrado em: {formatarData(cultivo.dataColheitaFinal)}
                                    </div>
                                )}

                                {!isFinalizado && cultivo.quantidadePlantada > 0 && (
                                    <div className="cultivo-info-row" style={{opacity:0.7}}>
                                        <Sprout size={13}/> Plantado: <strong style={{marginLeft:4}}>{cultivo.quantidadePlantada} {cultivo.unidadeMedida || 'un'}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Ações */}
                            {!isFinalizado && (
                                <div className="cultivo-actions">
                                    {/* Praga */}
                                    <button
                                        className={`btn-action-cultivo ${cultivo.estadoPlanta === 'PRAGA' ? 'pest-active' : 'pest'}`}
                                        onClick={() => abrirModalEvento('PRAGA', cultivo)}
                                        disabled={!isAtivo} style={{opacity: isAtivo ? 1 : 0.5}}
                                    >
                                        <Bug size={15}/> {cultivo.estadoPlanta === 'PRAGA' ? 'Ver Praga' : 'Praga'}
                                    </button>

                                    {/* Colheita — só aparece para ativos */}
                                    {isAtivo && (
                                        <button className="btn-action-cultivo harvest" onClick={() => abrirColheita(cultivo)}>
                                            <Scissors size={15}/> Colheita
                                        </button>
                                    )}

                                    {/* Histórico */}
                                    <button className="btn-icon-sm" onClick={() => abrirHistorico(cultivo)} title="Histórico">
                                        <History size={16}/>
                                    </button>

                                    {/* Editar */}
                                    <button className="btn-icon-sm" onClick={() => abrirModal(cultivo)} title="Editar">
                                        <Pencil size={16}/>
                                    </button>

                                    {/* Encerrar */}
                                    {isAtivo && (
                                        <button className="btn-icon-sm danger" onClick={() => abrirEncerrar(cultivo)} title="Encerrar Safra">
                                            <Flag size={16}/>
                                        </button>
                                    )}

                                    {/* Excluir */}
                                    <button className="btn-icon-sm danger" onClick={() => setConfirmacaoExclusao({aberta:true,id:cultivo.idCultivo})} title="Excluir">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            )}

                            {/* Ações para finalizados */}
                            {isFinalizado && (
                                <div className="cultivo-actions">
                                    <button className="btn-icon-sm" onClick={() => abrirHistorico(cultivo)}><History size={16}/></button>
                                    <button className="btn-icon-sm danger" onClick={() => setConfirmacaoExclusao({aberta:true,id:cultivo.idCultivo})}><Trash2 size={16}/></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ════════════════════════════════════════════
                MODAL: CADASTRO / EDIÇÃO
            ════════════════════════════════════════════ */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth:'600px', padding:'1.5rem'}}>
                        <div className="modal-header-flex" style={{marginBottom:'1rem'}}>
                            <h2 className="modal-title">{editandoId ? 'Editar Cultivo' : 'Novo Cultivo'}</h2>
                            <X size={20} onClick={fecharModal} style={{cursor:'pointer'}}/>
                        </div>
                        <form onSubmit={salvarCultivo}>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                                {!editandoId && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Área *</label>
                                            <select className="form-select" value={formCultivo.idArea} onChange={e => setFormCultivo({...formCultivo, idArea: e.target.value})} required>
                                                <option value="">Selecione a área...</option>
                                                {areasDisponiveis.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea} ({a.tamanhoArea}ha)</option>)}
                                            </select>
                                            {areas.length > areasDisponiveis.length && (
                                                <small style={{color:'#94a3b8',fontSize:'0.72rem'}}>Áreas com cultivo ativo foram ocultadas</small>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Planta *</label>
                                            <select className="form-select" value={formCultivo.idPlanta} onChange={e => setFormCultivo({...formCultivo, idPlanta: e.target.value})} required>
                                                <option value="">Selecione...</option>
                                                {plantas.map(p => <option key={p.idPlanta} value={p.idPlanta}>{p.nomePopular}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Tipo de Ciclo — obrigatório na criação */}
                                {!editandoId && (
                                    <div className="form-group" style={{gridColumn:'1/-1'}}>
                                        <label className="form-label">Tipo de Ciclo *</label>
                                        <div className="tipo-ciclo-selector">
                                            <button type="button"
                                                className={`tipo-ciclo-btn ${formCultivo.tipoCiclo === 'UNICO' ? 'active' : ''}`}
                                                onClick={() => setFormCultivo({...formCultivo, tipoCiclo:'UNICO'})}>
                                                <strong>Ciclo Único</strong>
                                                <span>Uma colheita encerra o cultivo (ex: Soja, Milho, Feijão)</span>
                                            </button>
                                            <button type="button"
                                                className={`tipo-ciclo-btn ${formCultivo.tipoCiclo === 'CONTINUO' ? 'active' : ''}`}
                                                onClick={() => setFormCultivo({...formCultivo, tipoCiclo:'CONTINUO'})}>
                                                <strong>Ciclo Contínuo</strong>
                                                <span>Múltiplas colheitas sem encerrar (ex: Pimenta, Café, Mamão)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Qtd Plantada *</label>
                                    <input type="number" min="0.01" step="0.01" className="form-input"
                                        value={formCultivo.quantidadePlantada}
                                        onChange={e => setFormCultivo({...formCultivo, quantidadePlantada: e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unidade de Medida</label>
                                    <select className="form-select" value={formCultivo.unidadeMedida} onChange={e => setFormCultivo({...formCultivo, unidadeMedida: e.target.value})}>
                                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data de Plantio *</label>
                                    <input type="date" className="form-input" value={formCultivo.dataPlantio}
                                        onChange={e => setFormCultivo({...formCultivo, dataPlantio: e.target.value})} required/>
                                </div>

                                {editandoId && (
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={formCultivo.statusCultivo} onChange={e => setFormCultivo({...formCultivo, statusCultivo: e.target.value})}>
                                            <option value="EM_PREPARO">Em Preparo</option>
                                            <option value="ATIVO">Em Crescimento</option>
                                            <option value="EM_PRODUCAO">Em Produção</option>
                                            <option value="COLHIDO">Encerrado</option>
                                            <option value="CANCELADO">Cancelado</option>
                                        </select>
                                    </div>
                                )}

                                {editandoId && (
                                    <div className="form-group">
                                        <label className="form-label">Estado da Planta</label>
                                        <select className="form-select" value={formCultivo.estadoPlanta} onChange={e => setFormCultivo({...formCultivo, estadoPlanta: e.target.value})}>
                                            <option value="SAUDAVEL">Saudável</option>
                                            <option value="ATENCAO">Em Atenção</option>
                                            <option value="PRAGA">Com Praga</option>
                                            <option value="CRITICO">Crítico</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{marginTop:'10px'}}>
                                <label className="form-label">Observações</label>
                                <input className="form-input" value={formCultivo.observacaoCultivo}
                                    onChange={e => setFormCultivo({...formCultivo, observacaoCultivo: e.target.value})}
                                    placeholder="Informações adicionais sobre o plantio..."/>
                            </div>

                            <div className="modal-footer" style={{paddingTop:'1rem'}}>
                                <button type="button" className="btn-outline" onClick={fecharModal}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={carregando}>
                                    {carregando ? "Salvando..." : "Salvar Cultivo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: REGISTRAR PRAGA / IRRIGAÇÃO
            ════════════════════════════════════════════ */}
            {modalEventoAberto && acaoEvento && (
                <div className="modal-modern-overlay" style={{zIndex:10002}}>
                    <div className="modal-modern-content" style={{maxWidth:'450px', padding:'1.5rem'}}>
                        <div className="event-modal-header">
                            <div className={`icon-circle-event ${acaoEvento.tipo === 'IRRIGACAO' ? 'bg-water-soft' : 'bg-pest-soft'}`}>
                                {acaoEvento.tipo === 'IRRIGACAO' ? <Droplets size={20}/> : <Bug size={20}/>}
                            </div>
                            <div>
                                <h3 style={{margin:0,fontSize:'1.1rem',fontWeight:700}}>
                                    {acaoEvento.tipo === 'IRRIGACAO' ? 'Registrar Irrigação' : 'Ocorrência de Praga'}
                                </h3>
                                <p style={{margin:0,fontSize:'0.85rem',color:'#64748b'}}>{acaoEvento.nomePlanta}</p>
                            </div>
                            <X size={20} onClick={() => setModalEventoAberto(false)} style={{marginLeft:'auto',cursor:'pointer',color:'#94a3b8'}}/>
                        </div>

                        <form onSubmit={salvarEvento}>
                            {acaoEvento.tipo === 'IRRIGACAO' ? (
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                                    <div className="form-group">
                                        <label className="form-label">Volume (L/mm)</label>
                                        <input type="number" step="0.1" className="form-input" required value={dadosEvento.volume} onChange={e => setDadosEvento({...dadosEvento, volume: e.target.value})}/>
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
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                                    <div className="form-group">
                                        <label className="form-label">Nome da Praga</label>
                                        <input type="text" className="form-input" required placeholder="Ex: Pulgão" value={dadosEvento.nome} onChange={e => setDadosEvento({...dadosEvento, nome: e.target.value})}/>
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
                            <div className="form-group" style={{marginBottom:'12px'}}>
                                <label className="form-label">Data e Hora</label>
                                <input type="datetime-local" className="form-input" required value={dadosEvento.dataHora} onChange={e => setDadosEvento({...dadosEvento, dataHora: e.target.value})}/>
                            </div>
                            <div className="form-group" style={{marginBottom:'16px'}}>
                                <label className="form-label">Observações</label>
                                <input className="form-input" placeholder="Opcional..." value={dadosEvento.obs} onChange={e => setDadosEvento({...dadosEvento, obs: e.target.value})}/>
                            </div>
                            <div style={{display:'flex',gap:'10px',flexDirection:'column'}}>
                                <div style={{display:'flex',gap:'10px'}}>
                                    <button type="button" className="btn-outline" style={{flex:1}} onClick={() => setModalEventoAberto(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary" style={{flex:2}} disabled={carregando}>
                                        {carregando ? 'Salvando...' : <><Save size={16} style={{marginRight:6}}/> Registrar</>}
                                    </button>
                                </div>
                                {acaoEvento.tipo === 'PRAGA' && cultivos.find(c => c.idCultivo === acaoEvento.id)?.estadoPlanta === 'PRAGA' && (
                                    <div>
                                        <input className="form-input" style={{marginBottom:'8px'}} placeholder="O que foi feito para resolver a praga?"
                                            value={dadosEvento.acaoControle} onChange={e => setDadosEvento({...dadosEvento, acaoControle: e.target.value})}/>
                                        <button type="button" className="btn-action-cultivo" style={{background:'#16a34a',color:'white',width:'100%'}}
                                            onClick={() => resolverPraga(acaoEvento.id, dadosEvento.acaoControle)}>
                                            <CheckCircle2 size={16} style={{marginRight:6}}/> Marcar como Resolvida
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: REGISTRAR COLHEITA / APANHA
            ════════════════════════════════════════════ */}
            {modalColheitaAberto && cultivoColhendo && (
                <div className="modal-modern-overlay" style={{zIndex:10002}}>
                    <div className="modal-modern-content" style={{maxWidth:'520px', padding:'1.5rem'}}>
                        <div className="modal-header-flex" style={{marginBottom:'1rem'}}>
                            <div>
                                <h2 className="modal-title" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                    <Scissors size={20} color="#16a34a"/> Registrar Colheita
                                </h2>
                                <p style={{margin:0,fontSize:'0.85rem',color:'#64748b'}}>
                                    {cultivoColhendo.plantaCultivada?.nomePopular} · {cultivoColhendo.areaCultivo?.nomeArea}
                                </p>
                            </div>
                            <X size={20} onClick={() => setModalColheitaAberto(false)} style={{cursor:'pointer'}}/>
                        </div>

                        {cultivoColhendo.tipoCiclo === 'CONTINUO' && (
                            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',fontSize:'0.82rem',color:'#166534'}}>
                                <strong>Ciclo Contínuo</strong> — Esta apanha será acumulada ao total. Após o primeiro registro, o cultivo passa para "Em Produção".
                            </div>
                        )}

                        <form onSubmit={submeterColheita}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                                <div className="form-group">
                                    <label className="form-label">Quantidade Colhida *</label>
                                    <input type="number" min="0.01" step="0.01" className="form-input" required
                                        value={colheitaForm.quantidadeColhida}
                                        onChange={e => setColheitaForm({...colheitaForm, quantidadeColhida: e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unidade</label>
                                    <select className="form-select" value={colheitaForm.unidadeMedida} onChange={e => setColheitaForm({...colheitaForm, unidadeMedida: e.target.value})}>
                                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{marginBottom:'12px'}}>
                                <label className="form-label">Data e Hora</label>
                                <input type="datetime-local" className="form-input"
                                    value={colheitaForm.dataHora}
                                    onChange={e => setColheitaForm({...colheitaForm, dataHora: e.target.value})}/>
                            </div>

                            {/* Insumos utilizados */}
                            <div className="form-group">
                                <label className="form-label"><Package size={13}/> Insumos Aplicados (opcional)</label>
                                <div className="insumo-picker-row">
                                    <select className="login-input" value={insumoSel} onChange={e => setInsumoSel(e.target.value)}>
                                        <option value="">Selecionar do estoque...</option>
                                        {estoqueInsumos.map(item => (
                                            <option key={item.idEstoque} value={item.idEstoque}>
                                                {item.nome} — {item.subcategoria} ({item.quantidadeEstoque} {item.unidadeMedida} disp.)
                                            </option>
                                        ))}
                                    </select>
                                    <input type="number" className="login-input insumo-qty" min="1" value={qtdInsumo} onChange={e => setQtdInsumo(Number(e.target.value))}/>
                                    <button type="button" className="btn-add-insumo" onClick={adicionarInsumo}><Plus size={15}/></button>
                                </div>
                                {colheitaForm.insumosUsados.length > 0 && (
                                    <div className="insumos-list">
                                        {colheitaForm.insumosUsados.map(ins => (
                                            <div key={ins.idEstoque} className="insumo-tag">
                                                <Package size={12}/> {ins.nome} — {ins.quantidade} {ins.unidadeMedida}
                                                <button type="button" className="btn-rm-insumo" onClick={() => removerInsumo(ins.idEstoque)}><X size={10}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Observação */}
                            <div className="form-group">
                                <label className="form-label">Observações</label>
                                <input className="form-input" placeholder="Ex: Frutos com boa coloração, colheita seletiva..." value={colheitaForm.observacao} onChange={e => setColheitaForm({...colheitaForm, observacao: e.target.value})}/>
                            </div>

                            {/* Foto */}
                            <div className="form-group">
                                <label className="form-label"><Camera size={13}/> Foto da Colheita (opcional)</label>
                                {colheitaForm.fotoColheita ? (
                                    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                                        <img src={colheitaForm.fotoColheita} alt="Preview" style={{maxWidth:'100%',maxHeight:'140px',objectFit:'cover',borderRadius:'10px',border:'2px solid #e2e8f0'}}/>
                                        <button type="button" className="btn-rm-foto" onClick={() => setColheitaForm(p => ({...p, fotoColheita:null}))}><X size={12}/> Remover</button>
                                    </div>
                                ) : (
                                    <label className="btn-upload-foto">
                                        <Camera size={17}/> Adicionar da Galeria
                                        <input type="file" accept="image/*" hidden onChange={handleFotoColheita}/>
                                    </label>
                                )}
                            </div>

                            <div className="modal-footer" style={{paddingTop:'1rem'}}>
                                <button type="button" className="btn-outline" onClick={() => setModalColheitaAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={carregando}>
                                    {carregando ? 'Registrando...' : <><Scissors size={15} style={{marginRight:6}}/> Registrar Apanha</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: ENCERRAR SAFRA
            ════════════════════════════════════════════ */}
            {modalEncerrarAberto && cultivoEncerrando && (
                <div className="modal-modern-overlay" style={{zIndex:10002}}>
                    <div className="modal-modern-content" style={{maxWidth:'420px', padding:'1.5rem', textAlign:'center'}}>
                        <div style={{background:'#fef3c7',width:'52px',height:'52px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                            <Flag size={24} color="#f59e0b"/>
                        </div>
                        <h3 className="modal-title">Encerrar Safra</h3>
                        <p style={{color:'#64748b',marginBottom:'20px',fontSize:'0.9rem'}}>
                            Encerrar <strong>{cultivoEncerrando.plantaCultivada?.nomePopular}</strong> na área <strong>{cultivoEncerrando.areaCultivo?.nomeArea}</strong>?
                            A área será liberada para novo plantio.
                        </p>
                        <form onSubmit={submeterEncerramento}>
                            <div className="form-group" style={{textAlign:'left',marginBottom:'12px'}}>
                                <label className="form-label">Data de Encerramento</label>
                                <input type="date" className="form-input" value={encerrarForm.dataEncerramento} onChange={e => setEncerrarForm({...encerrarForm, dataEncerramento: e.target.value})} required/>
                            </div>
                            <div className="form-group" style={{textAlign:'left',marginBottom:'20px'}}>
                                <label className="form-label">Motivo (opcional)</label>
                                <input className="form-input" placeholder="Ex: Fim da vida útil, troca de cultura..."
                                    value={encerrarForm.motivoEncerramento} onChange={e => setEncerrarForm({...encerrarForm, motivoEncerramento: e.target.value})}/>
                            </div>
                            <div style={{display:'flex',gap:'10px'}}>
                                <button type="button" className="btn-outline" style={{flex:1}} onClick={() => setModalEncerrarAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn-danger" style={{flex:1}} disabled={carregando}>
                                    {carregando ? 'Encerrando...' : 'Encerrar Safra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: HISTÓRICO DE MANEJO
            ════════════════════════════════════════════ */}
            {modalHistoricoAberto && cultivoSelecionado && (
                <div className="modal-modern-overlay" style={{zIndex:10001}}>
                    <div className="modal-modern-content" style={{maxWidth:'520px', maxHeight:'80vh', display:'flex', flexDirection:'column'}}>
                        <div className="modal-header-flex" style={{paddingBottom:'1rem',borderBottom:'1px solid #e2e8f0'}}>
                            <div>
                                <h2 className="modal-title">Histórico de Manejo</h2>
                                <p style={{fontSize:'0.85rem',color:'#64748b',margin:0}}>
                                    {cultivoSelecionado?.plantaCultivada?.nomePopular} · {cultivoSelecionado?.areaCultivo?.nomeArea}
                                </p>
                            </div>
                            <X size={20} onClick={() => setModalHistoricoAberto(false)} style={{cursor:'pointer'}}/>
                        </div>

                        <div className="modal-historico-body" style={{flex:1}}>
                            {historicoEventos.length === 0 ? (
                                <div style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>
                                    <Clock size={40} style={{margin:'0 auto 10px',opacity:0.5}}/>
                                    <p>Nenhuma atividade registrada.</p>
                                </div>
                            ) : (
                                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                    {historicoEventos.map((ev, idx) => (
                                        <div key={idx} className={`historico-item ${ev.tipo.toLowerCase()}`}>
                                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                                    {ev.tipo === 'IRRIGACAO' && <Droplets size={15} color="#0284c7"/>}
                                                    {ev.tipo === 'PRAGA'     && <Bug size={15} color="#ea580c"/>}
                                                    {ev.tipo === 'COLHEITA'  && <Scissors size={15} color="#16a34a"/>}
                                                    <strong style={{fontSize:'0.9rem'}}>
                                                        {ev.tipo === 'IRRIGACAO' && `${ev.volumeAgua}L - ${ev.metodo}`}
                                                        {ev.tipo === 'PRAGA'     && ev.nomePragaOuDoenca}
                                                        {ev.tipo === 'COLHEITA'  && `${ev.quantidadeColhida} ${ev.unidadeMedida} colhidos`}
                                                    </strong>
                                                </div>
                                                {ev.tipo !== 'COLHEITA' && (
                                                    <div style={{display:'flex',gap:'4px'}}>
                                                        <button onClick={() => excluirEvento(ev.idEvento, ev.tipo)} className="btn-icon-sm danger" style={{width:24,height:24}}><Trash2 size={11}/></button>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{fontSize:'0.75rem',color:'#64748b',marginTop:'4px'}}>
                                                {new Date(ev.dataHora).toLocaleString('pt-BR')}
                                            </div>
                                            {ev.observacaoEvento && (
                                                <p style={{fontSize:'0.8rem',marginTop:'5px',color:'#475569',fontStyle:'italic'}}>"{ev.observacaoEvento}"</p>
                                            )}
                                            {/* Foto da colheita */}
                                            {ev.tipo === 'COLHEITA' && ev.fotoColheita && (
                                                <img src={ev.fotoColheita} alt="Colheita" style={{maxWidth:'100%',maxHeight:'120px',objectFit:'cover',borderRadius:'8px',marginTop:'8px'}}/>
                                            )}
                                            {/* Insumos usados na colheita */}
                                            {ev.tipo === 'COLHEITA' && ev.insumosUsadosJson && (() => {
                                                try {
                                                    const ins = JSON.parse(ev.insumosUsadosJson);
                                                    if (ins.length === 0) return null;
                                                    return (
                                                        <div style={{marginTop:'6px',display:'flex',flexWrap:'wrap',gap:'4px'}}>
                                                            {ins.map((i, ii) => (
                                                                <span key={ii} style={{background:'#fef3c7',color:'#78350f',padding:'2px 8px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:600}}>
                                                                    <Package size={10}/> {i.nome} ({i.quantidade} {i.unidadeMedida})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                } catch { return null; }
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cultivoSelecionado?.estadoPlanta === 'PRAGA' && (
                            <div style={{paddingTop:'1rem',borderTop:'1px solid #e2e8f0',marginTop:'10px'}}>
                                <button className="btn-action-cultivo" style={{background:'#16a34a',color:'white',width:'100%'}} onClick={() => resolverPraga(cultivoSelecionado.idCultivo, '')}>
                                    <CheckCircle2 size={16} style={{marginRight:8}}/> Resolver Problema
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: CONFIRMAÇÃO EXCLUSÃO
            ════════════════════════════════════════════ */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay" style={{zIndex:10005}}>
                    <div className="modal-modern-content" style={{maxWidth:'400px',textAlign:'center'}}>
                        <AlertCircle size={48} color="#dc2626" style={{margin:'0 auto 15px'}}/>
                        <h3 className="modal-title">Remover Cultivo?</h3>
                        <p style={{color:'#64748b',margin:'10px 0 20px'}}>O histórico de eventos deste plantio será perdido.</p>
                        <div style={{display:'flex',gap:'10px'}}>
                            <button className="btn-outline" style={{flex:1}} onClick={() => setConfirmacaoExclusao({aberta:false})}>Voltar</button>
                            <button className="btn-danger" style={{flex:1}} onClick={executarExclusao}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cultivos;
