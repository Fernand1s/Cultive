import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Tarefas.css';
import {
    Plus, Calendar, Trash2, User, CheckCircle2, Edit2, Ban,
    StickyNote, ClipboardList, X, Clock, AlertTriangle, Eye,
    Package, Camera, ChevronRight, History
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";
import { tarefaService, userService, estoqueService, areaService, cultivoService } from "../services/api.js";

// ─── Categorias e Subcategorias Rurais ───────────────────────────
const CATEGORIAS_TAREFAS = {
    "Planejamento e Preparo do Solo": [
        "Amostragem de Solo", "Limpeza da Área", "Preparo Pesado do Solo",
        "Correção do Solo", "Preparo de Canteiros/Covas", "Adubação de Fundação", "Instalação de Mulching",
    ],
    "Plantio e Semeadura": [
        "Tratamento de Sementes/Mudas", "Semeadura Direta/Mecanizada", "Semeadura Manual",
        "Transplantio de Mudas", "Irrigação de Pega",
    ],
    "Tratos Culturais e Manejo Fitotécnico": [
        "Desbaste/Raleio", "Tutoramento / Condução", "Podas",
        "Desbrota", "Amontoa", "Manejo de Plantas Daninhas", "Ensacamento de Frutos",
    ],
    "Nutrição e Irrigação": [
        "Monitoramento de Umidade", "Operação de Irrigação", "Manutenção de Irrigação",
        "Adubação de Cobertura", "Fertirrigação", "Adubação Foliar",
    ],
    "Manejo Fitossanitário": [
        "Monitoramento (Praguejamento)", "Controle Químico", "Controle Biológico", "Controle Cultural/Físico",
    ],
    "Colheita e Pós-Colheita": [
        "Avaliação de Ponto de Colheita", "Colheita Manual", "Colheita Mecanizada",
        "Limpeza Inicial (Toalete)", "Transporte Interno",
    ],
    "Manutenção Geral da Propriedade": [
        "Manutenção de Estruturas Protegidas", "Gestão de Maquinário",
        "Manejo de Solo e Água", "Limpeza de Ferramentas",
    ],
};

const SUBCATEGORIAS_COM_INSUMOS = new Set([
    "Correção do Solo", "Adubação de Fundação", "Instalação de Mulching",
    "Tratamento de Sementes/Mudas",
    "Adubação de Cobertura", "Fertirrigação", "Adubação Foliar",
    "Controle Químico", "Controle Biológico",
]);

const SUBCATEGORIAS_OBSERVACAO = new Set([
    "Monitoramento (Praguejamento)", "Controle Químico",
    "Controle Biológico", "Controle Cultural/Físico",
]);

// Comprime imagem antes de salvar como base64
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

const TAREFA_INICIAL = {
    titulo: '', descricao: '', prioridade: 'ALTA',
    categoria: '', subcategoria: '', informacoesExtras: '',
    dataPrazo: '', idResponsavel: '',
    idArea: '', idCultivo: '',
};

const Tarefas = () => {
    const notify = useNotify();

    const [usuarioLogado] = useState(() => {
        try { return JSON.parse(localStorage.getItem('usuario_logado')) ?? null; }
        catch { return null; }
    });

    const [tarefas, setTarefas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [estoqueInsumos, setEstoqueInsumos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [cultivosAtivos, setCultivosAtivos] = useState([]);

    const [modalAberto, setModalAberto] = useState(false);
    const [modalConclusaoAberto, setModalConclusaoAberto] = useState(false);
    const [tarefaParaConcluir, setTarefaParaConcluir] = useState(null);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [idTarefaEditando, setIdTarefaEditando] = useState(null);
    const [carregando, setCarregando] = useState(false);

    const [novaTarefa, setNovaTarefa] = useState(TAREFA_INICIAL);
    const [conclusaoForm, setConclusaoForm] = useState({ observacao: '', fotoConclusao: null, insumosUsados: [] });
    const [insumoSel, setInsumoSel] = useState('');
    const [qtdInsumo, setQtdInsumo] = useState(1);

    // Modal de detalhes (clique no card)
    const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
    const [modalDetalheAberto, setModalDetalheAberto] = useState(false);

    // Modal de acompanhamento (Em Observação)
    const [modalObsUpdateAberto, setModalObsUpdateAberto] = useState(false);
    const [obsUpdateForm, setObsUpdateForm] = useState({ observacao: '', fotoConclusao: null });

    useEffect(() => {
        if (usuarioLogado?.idUsuario) carregarDados();
    }, [usuarioLogado]);

    const carregarDados = async () => {
        try {
            const souGestor = usuarioLogado.funcao.includes('ADMIN') || usuarioLogado.funcao.includes('GERENTE');
            const [resT, resE, resA, resC] = await Promise.all([
                tarefaService.listar(usuarioLogado.idUsuario, usuarioLogado.funcao),
                estoqueService.listar().catch(() => []),
                areaService.listar().catch(() => []),
                cultivoService.listar().catch(() => []),
            ]);
            setTarefas(resT);
            setEstoqueInsumos((resE || []).filter(e => e.categoria === 'INSUMO' && (e.quantidadeEstoque ?? 0) > 0));
            setAreas(resA || []);
            setCultivosAtivos((resC || []).filter(c => ['ATIVO', 'EM_PRODUCAO'].includes(c.statusCultivo)));
            if (souGestor) {
                const resU = await userService.listar().catch(() => []);
                setUsuarios(resU);
            }
        } catch {
            notify("Erro ao carregar tarefas.", "error");
        }
    };

    // ── Handlers de conclusão ──────────────────────────────────────
    const handleCheckConclusao = (tarefa) => {
        if (tarefa.emObservacao) {
            if (window.confirm(`Marcar "${tarefa.titulo}" como resolvida e concluída definitivamente?`)) {
                executarConclusao(tarefa, {});
            }
        } else if (tarefa.concluida) {
            executarConclusao(tarefa, {});
        } else {
            setTarefaParaConcluir(tarefa);
            setConclusaoForm({ observacao: '', fotoConclusao: null, insumosUsados: [] });
            setInsumoSel('');
            setQtdInsumo(1);
            setModalConclusaoAberto(true);
        }
    };

    const executarConclusao = async (tarefa, formData) => {
        if (carregando) return;
        setCarregando(true);
        try {
            await tarefaService.concluir(tarefa.id, usuarioLogado.idUsuario, formData);
            await carregarDados();
            setModalConclusaoAberto(false);
            notify("Status atualizado!", "success");
        } catch (err) {
            notify(err.message || "Erro ao atualizar tarefa.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const submeterConclusao = (e) => {
        e.preventDefault();
        if (!tarefaParaConcluir) return;
        executarConclusao(tarefaParaConcluir, {
            observacao: conclusaoForm.observacao,
            fotoConclusao: conclusaoForm.fotoConclusao,
            insumosUsados: conclusaoForm.insumosUsados,
        });
    };

    // ── Insumos ────────────────────────────────────────────────────
    const adicionarInsumo = () => {
        if (!insumoSel) return;
        const item = estoqueInsumos.find(e => String(e.idEstoque) === String(insumoSel));
        if (!item) return;
        if (conclusaoForm.insumosUsados.some(i => i.idEstoque === item.idEstoque)) {
            notify("Insumo já adicionado.", "error");
            return;
        }
        const qtdMax = item.quantidadeEstoque ?? 999;
        const qtdFinal = Math.min(qtdInsumo, qtdMax);
        setConclusaoForm(prev => ({
            ...prev,
            insumosUsados: [...prev.insumosUsados, {
                idEstoque: item.idEstoque,
                nome: item.nome,
                quantidade: qtdFinal,
                unidadeMedida: item.unidadeMedida || 'un',
            }],
        }));
        setInsumoSel('');
        setQtdInsumo(1);
    };

    const removerInsumo = (idEstoque) => {
        setConclusaoForm(prev => ({
            ...prev,
            insumosUsados: prev.insumosUsados.filter(i => i.idEstoque !== idEstoque),
        }));
    };

    // ── Foto ───────────────────────────────────────────────────────
    const handleFoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setConclusaoForm(prev => ({ ...prev, fotoConclusao: compressed }));
        } catch {
            notify("Erro ao processar imagem.", "error");
        }
        e.target.value = '';
    };

    // ── Helpers de status ──────────────────────────────────────────
    const getStatusInfo = (tarefa) => {
        if (tarefa.cancelada) return { cor: '#94a3b8', label: 'Cancelada', bg: '#f1f5f9' };
        if (tarefa.concluida) return { cor: '#16a34a', label: 'Concluída', bg: '#f0fdf4' };
        if (tarefa.emObservacao) return { cor: '#f59e0b', label: 'Em Observação', bg: '#fffbeb' };
        const hoje = new Date().toISOString().split('T')[0];
        const prazo = tarefa.dataPrazo?.split('T')[0];
        if (prazo && prazo < hoje) return { cor: '#ef4444', label: 'Atrasada', bg: '#fff5f5' };
        return { cor: '#3b82f6', label: 'Pendente', bg: '#eff6ff' };
    };

    // ── Modal de detalhes ──────────────────────────────────────────
    const abrirDetalhe = (tarefa) => {
        setTarefaSelecionada(tarefa);
        setModalDetalheAberto(true);
    };

    // ── Modal de acompanhamento (Em Observação) ────────────────────
    const abrirObsUpdate = (e, tarefa) => {
        e.stopPropagation();
        setTarefaSelecionada(tarefa);
        setObsUpdateForm({ observacao: '', fotoConclusao: null });
        setModalObsUpdateAberto(true);
    };

    const handleFotoObsUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setObsUpdateForm(prev => ({ ...prev, fotoConclusao: compressed }));
        } catch { notify("Erro ao processar imagem.", "error"); }
        e.target.value = '';
    };

    const manterEmObservacao = async () => {
        if (!obsUpdateForm.observacao.trim()) { notify("Descreva a atualização.", "error"); return; }
        if (carregando) return;
        setCarregando(true);
        try {
            await tarefaService.atualizarObservacao(tarefaSelecionada.id, usuarioLogado.idUsuario, {
                observacao: obsUpdateForm.observacao,
                fotoConclusao: obsUpdateForm.fotoConclusao,
            });
            await carregarDados();
            setModalObsUpdateAberto(false);
            notify("Observação atualizada!", "success");
        } catch (err) { notify(err.message || "Erro ao atualizar.", "error"); }
        finally { setCarregando(false); }
    };

    const concluirDefinitivamente = async () => {
        if (carregando) return;
        setCarregando(true);
        try {
            await tarefaService.concluir(tarefaSelecionada.id, usuarioLogado.idUsuario, {
                observacao: obsUpdateForm.observacao || '',
                fotoConclusao: obsUpdateForm.fotoConclusao,
            });
            await carregarDados();
            setModalObsUpdateAberto(false);
            notify("Tarefa concluída definitivamente!", "success");
        } catch (err) { notify(err.message || "Erro ao concluir.", "error"); }
        finally { setCarregando(false); }
    };

    // ── CRUD ───────────────────────────────────────────────────────
    const cancelarTarefa = async (id) => {
        if (carregando || !window.confirm('Deseja cancelar esta tarefa?')) return;
        setCarregando(true);
        try {
            await tarefaService.cancelar(id, usuarioLogado.idUsuario);
            await carregarDados();
        } catch { notify("Erro ao cancelar.", "error"); }
        finally { setCarregando(false); }
    };

    const excluirTarefa = async (id) => {
        if (carregando || !window.confirm('Excluir definitivamente?')) return;
        setCarregando(true);
        try {
            await tarefaService.excluir(id, usuarioLogado.idUsuario);
            await carregarDados();
            notify("Tarefa removida.", "success");
        } catch { notify("Erro ao excluir.", "error"); }
        finally { setCarregando(false); }
    };

    const salvarTarefa = async (e) => {
        e.preventDefault();
        if (carregando) return;
        setCarregando(true);
        const responsavelFinal = novaTarefa.idResponsavel || usuarioLogado.idUsuario;
        const dataFormatada = novaTarefa.dataPrazo.includes('T') ? novaTarefa.dataPrazo : `${novaTarefa.dataPrazo}T23:59:59`;
        const corpo = {
            titulo: novaTarefa.titulo,
            descricao: novaTarefa.descricao,
            prioridade: novaTarefa.prioridade,
            categoria: novaTarefa.categoria,
            subcategoria: novaTarefa.subcategoria,
            informacoesExtras: novaTarefa.informacoesExtras,
            dataPrazo: dataFormatada,
            idResponsavel: parseInt(responsavelFinal),
            idArea: novaTarefa.idArea ? parseInt(novaTarefa.idArea) : null,
            idCultivo: novaTarefa.idCultivo ? parseInt(novaTarefa.idCultivo) : null,
        };
        try {
            if (modoEdicao) {
                await tarefaService.atualizar(idTarefaEditando, usuarioLogado.idUsuario, corpo);
                notify("Tarefa atualizada!", "success");
            } else {
                await tarefaService.criar(corpo, usuarioLogado.idUsuario, responsavelFinal);
                notify("Tarefa criada!", "success");
            }
            await carregarDados();
            setModalAberto(false);
        } catch (error) {
            notify(error.message || "Erro ao processar tarefa.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const abrirModalEdicao = (tarefa) => {
        setModoEdicao(true);
        setIdTarefaEditando(tarefa.id);
        setNovaTarefa({
            titulo: tarefa.titulo || '',
            descricao: tarefa.descricao || '',
            prioridade: tarefa.prioridade || 'ALTA',
            categoria: tarefa.categoria || '',
            subcategoria: tarefa.subcategoria || '',
            informacoesExtras: tarefa.informacoesExtras || '',
            dataPrazo: tarefa.dataPrazo ? tarefa.dataPrazo.split('T')[0] : '',
            idResponsavel: tarefa.responsavel?.idUsuario || '',
            idArea: tarefa.idArea || '',
            idCultivo: tarefa.idCultivo || '',
        });
        setModalAberto(true);
    };

    // ── Render de cada card ────────────────────────────────────────
    const renderTarefa = (tarefa, tipo) => {
        const souAdmin = usuarioLogado.funcao.includes('ADMIN') || usuarioLogado.funcao.includes('EMPRESA');
        const temPermissao = (tarefa.criador?.idUsuario === usuarioLogado.idUsuario) || souAdmin;
        const ehResponsavel = tarefa.responsavel?.idUsuario === usuarioLogado.idUsuario;

        const hoje = new Date().toISOString().split('T')[0];
        const prazo = tarefa.dataPrazo?.split('T')[0];
        const atrasada = !tarefa.concluida && !tarefa.cancelada && !tarefa.emObservacao && prazo && prazo < hoje;

        let indicadorCor = '#e2e8f0';
        if (tarefa.cancelada) indicadorCor = '#94a3b8';
        else if (tarefa.concluida) indicadorCor = '#16a34a';
        else if (tarefa.emObservacao) indicadorCor = '#f59e0b';
        else if (atrasada) indicadorCor = '#ef4444';

        return (
            <div key={tarefa.id} className={`task-item ${tipo} ${atrasada ? 'atrasada' : ''}`}
                onClick={() => abrirDetalhe(tarefa)} style={{ cursor: 'pointer' }}>
                <div className="task-status-indicator" style={{ background: indicadorCor }} />

                {/* Checkbox (pendentes) ou botão olho (observação) */}
                {!tarefa.cancelada && !tarefa.concluida && !tarefa.emObservacao && (ehResponsavel || temPermissao) && (
                    <div className="custom-checkbox-container" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="custom-checkbox" checked={false}
                            onChange={() => handleCheckConclusao(tarefa)} />
                    </div>
                )}
                {tarefa.concluida && (ehResponsavel || temPermissao) && (
                    <div className="custom-checkbox-container" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="custom-checkbox" checked={true}
                            onChange={() => handleCheckConclusao(tarefa)} />
                    </div>
                )}
                {tarefa.emObservacao && (ehResponsavel || temPermissao) && (
                    <button className="btn-obs-finalizar" onClick={(e) => abrirObsUpdate(e, tarefa)}
                        title="Atualizar observação ou concluir">
                        <Eye size={18} />
                    </button>
                )}

                <div className="task-content">
                    <div className="task-main-info">
                        <h4 className="task-title">{tarefa.titulo}</h4>
                        {!tarefa.cancelada && (
                            <span className={`priority-badge prio-${tarefa.prioridade?.toLowerCase()}`}>
                                {tarefa.prioridade}
                            </span>
                        )}
                        {tarefa.categoria && (
                            <span className="cat-badge">
                                {tarefa.subcategoria || tarefa.categoria}
                            </span>
                        )}
                        {atrasada && (
                            <span className="priority-badge" style={{ background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={10} /> Atrasada
                            </span>
                        )}
                    </div>

                    {tarefa.descricao && <p className="task-desc">{tarefa.descricao}</p>}

                    {tarefa.informacoesExtras && (
                        <div className="task-extra-info">
                            <StickyNote size={13} />
                            <span>{tarefa.informacoesExtras}</span>
                        </div>
                    )}

                    <div className="task-meta">
                        <span className="meta-tag"><Calendar size={12} /> {tarefa.dataPrazo ? new Date(tarefa.dataPrazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                        <span className="meta-tag"><User size={12} /> {tarefa.responsavel?.nomeUsuario}</span>
                        {tarefa.nomeArea && (
                            <span className="meta-tag" style={{background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe'}}>
                                <ClipboardList size={12} /> {tarefa.nomeArea}{tarefa.nomeCultivo ? ` · ${tarefa.nomeCultivo}` : ''}
                            </span>
                        )}
                        {tarefa.observacaoConclusao && (
                            <span className="meta-tag" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}>
                                <CheckCircle2 size={12} /> {tarefa.observacaoConclusao}
                            </span>
                        )}
                        {tarefa.insumosUsados?.length > 0 && (
                            <span className="meta-tag insumos-meta">
                                <Package size={12} />
                                {tarefa.insumosUsados.map(i => `${i.nome} (${i.quantidade} ${i.unidadeMedida})`).join(' · ')}
                            </span>
                        )}
                        {tarefa.fotoConclusao && (
                            <span className="meta-tag foto-thumb-wrapper">
                                <img src={tarefa.fotoConclusao} alt="Execução" className="task-foto-thumb" />
                            </span>
                        )}
                        <span className="meta-tag" style={{ opacity: 0.55 }}>
                            Criado por: {tarefa.criador?.nomeUsuario || 'Sistema'}
                        </span>
                    </div>
                </div>

                <div className="task-actions" onClick={e => e.stopPropagation()}>
                    {!tarefa.cancelada && !tarefa.concluida && !tarefa.emObservacao && temPermissao && (
                        <button onClick={() => abrirModalEdicao(tarefa)} className="btn-icon-sm">
                            <Edit2 size={16} />
                        </button>
                    )}
                    {!tarefa.cancelada && !tarefa.concluida && !tarefa.emObservacao && temPermissao && (
                        <button onClick={() => cancelarTarefa(tarefa.id)} className="btn-icon-sm warning">
                            <Ban size={16} />
                        </button>
                    )}
                    {temPermissao && (
                        <button onClick={() => excluirTarefa(tarefa.id)} className="btn-icon-sm danger">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ── Variáveis derivadas ────────────────────────────────────────
    const subcatsDisponiveis = CATEGORIAS_TAREFAS[novaTarefa.categoria] || [];
    const precisaInsumos = tarefaParaConcluir && SUBCATEGORIAS_COM_INSUMOS.has(tarefaParaConcluir.subcategoria);
    const vaiParaObservacao = tarefaParaConcluir && SUBCATEGORIAS_OBSERVACAO.has(tarefaParaConcluir.subcategoria);

    const pendentes = tarefas.filter(t => !t.concluida && !t.cancelada && !t.emObservacao);
    const emObservacao = tarefas.filter(t => t.emObservacao);
    const concluidas = tarefas.filter(t => t.concluida && !t.cancelada);
    const arquivadas = tarefas.filter(t => t.cancelada);

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Centro de Atividades</h1>
                    <p className="dashboard-subtitle">Acompanhe e execute as demandas da fazenda.</p>
                </div>
                <button className="botao-ver" onClick={() => {
                    setModoEdicao(false);
                    setNovaTarefa({ ...TAREFA_INICIAL, idResponsavel: usuarioLogado.idUsuario });
                    setModalAberto(true);
                }}>
                    <Plus size={20} /> Nova Tarefa
                </button>
            </div>

            {/* ── PENDENTES ── */}
            <div className="task-list-container">
                {pendentes.length === 0 ? (
                    <div className="empty-state-tasks">
                        <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#64748b' }}>Tudo em dia!</h3>
                        <p style={{ color: '#94a3b8' }}>Sem tarefas pendentes.</p>
                    </div>
                ) : (
                    pendentes.map(t => renderTarefa(t, 'pendente'))
                )}
            </div>

            {/* ── EM OBSERVAÇÃO ── */}
            {emObservacao.length > 0 && (
                <>
                    <div className="section-divider obs">
                        <span><Eye size={13} /> Em Observação</span>
                    </div>
                    <div className="task-list-container">
                        {emObservacao.map(t => renderTarefa(t, 'observacao'))}
                    </div>
                </>
            )}

            {/* ── CONCLUÍDAS ── */}
            {concluidas.length > 0 && (
                <>
                    <div className="section-divider"><span>Concluídas</span></div>
                    <div className="task-list-container">
                        {concluidas.map(t => renderTarefa(t, 'completed'))}
                    </div>
                </>
            )}

            {/* ── ARQUIVADAS ── */}
            {arquivadas.length > 0 && (
                <>
                    <div className="section-divider"><span>Arquivadas / Canceladas</span></div>
                    <div className="task-list-container">
                        {arquivadas.map(t => renderTarefa(t, 'cancelled'))}
                    </div>
                </>
            )}

            {/* ════════════════════════════════════════════
                MODAL: DETALHES DA TAREFA (clique no card)
            ════════════════════════════════════════════ */}
            {modalDetalheAberto && tarefaSelecionada && (() => {
                const si = getStatusInfo(tarefaSelecionada);
                const souAdmin = usuarioLogado.funcao.includes('ADMIN') || usuarioLogado.funcao.includes('EMPRESA');
                const temPerm = (tarefaSelecionada.criador?.idUsuario === usuarioLogado.idUsuario) || souAdmin;
                const pendente = !tarefaSelecionada.concluida && !tarefaSelecionada.cancelada && !tarefaSelecionada.emObservacao;
                return (
                    <div className="modal-modern-overlay-tarefa" onClick={() => setModalDetalheAberto(false)}>
                        <div className="modal-detalhe-content" onClick={e => e.stopPropagation()}>
                            <div style={{ height: '6px', background: si.cor, borderRadius: '24px 24px 0 0' }} />

                            <div className="modal-detalhe-header-tarefa">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="detalhe-badges-row">
                                        <span className="status-badge-detalhe" style={{ background: si.bg, color: si.cor }}>{si.label}</span>
                                        {tarefaSelecionada.prioridade && (
                                            <span className={`priority-badge prio-${tarefaSelecionada.prioridade.toLowerCase()}`}>{tarefaSelecionada.prioridade}</span>
                                        )}
                                    </div>
                                    <h2 className="detalhe-titulo-tarefa">{tarefaSelecionada.titulo}</h2>
                                    {tarefaSelecionada.categoria && (
                                        <div className="task-cat-path" style={{ marginTop: '8px' }}>
                                            <span>{tarefaSelecionada.categoria}</span>
                                            {tarefaSelecionada.subcategoria && <><ChevronRight size={13} /><span>{tarefaSelecionada.subcategoria}</span></>}
                                        </div>
                                    )}
                                </div>
                                <button className="btn-close-modal-tarefa" onClick={() => setModalDetalheAberto(false)}><X size={20} /></button>
                            </div>

                            <div className="modal-detalhe-body">
                                {tarefaSelecionada.descricao && (
                                    <div className="detalhe-secao">
                                        <h4 className="detalhe-secao-titulo">Descrição</h4>
                                        <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>{tarefaSelecionada.descricao}</p>
                                    </div>
                                )}

                                {tarefaSelecionada.informacoesExtras && (
                                    <div className="detalhe-secao" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <h4 className="detalhe-secao-titulo" style={{ color: '#16a34a' }}>Orientações do Gestor</h4>
                                        <p style={{ margin: 0, color: '#166534', lineHeight: 1.5 }}>{tarefaSelecionada.informacoesExtras}</p>
                                    </div>
                                )}

                                <div className="detalhe-secao">
                                    <h4 className="detalhe-secao-titulo">Informações</h4>
                                    <div className="detalhe-grid">
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Responsável</span>
                                            <span className="detalhe-valor">{tarefaSelecionada.responsavel?.nomeUsuario || '—'}</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Criado por</span>
                                            <span className="detalhe-valor">{tarefaSelecionada.criador?.nomeUsuario || 'Sistema'}</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Data Limite</span>
                                            <span className="detalhe-valor">{tarefaSelecionada.dataPrazo ? new Date(tarefaSelecionada.dataPrazo).toLocaleDateString('pt-BR') : '—'}</span>
                                        </div>
                                        <div className="detalhe-campo">
                                            <span className="detalhe-label">Urgência</span>
                                            <span className="detalhe-valor">{tarefaSelecionada.prioridade || '—'}</span>
                                        </div>
                                        {tarefaSelecionada.nomeArea && (
                                            <div className="detalhe-campo">
                                                <span className="detalhe-label">Talhão / Área</span>
                                                <span className="detalhe-valor">{tarefaSelecionada.nomeArea}</span>
                                            </div>
                                        )}
                                        {tarefaSelecionada.nomeCultivo && (
                                            <div className="detalhe-campo">
                                                <span className="detalhe-label">Cultivo</span>
                                                <span className="detalhe-valor">{tarefaSelecionada.nomeCultivo}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(tarefaSelecionada.concluida || tarefaSelecionada.emObservacao) && tarefaSelecionada.observacaoConclusao && (
                                    <div className="detalhe-secao" style={{ background: tarefaSelecionada.emObservacao ? '#fffbeb' : '#f0fdf4', border: `1px solid ${tarefaSelecionada.emObservacao ? '#fde68a' : '#bbf7d0'}` }}>
                                        <h4 className="detalhe-secao-titulo" style={{ color: tarefaSelecionada.emObservacao ? '#92400e' : '#16a34a' }}>
                                            {tarefaSelecionada.emObservacao ? 'Último Registro (Em Observação)' : 'Registro de Conclusão'}
                                        </h4>
                                        <p style={{ margin: 0, lineHeight: 1.5, color: tarefaSelecionada.emObservacao ? '#78350f' : '#166534' }}>{tarefaSelecionada.observacaoConclusao}</p>
                                        {tarefaSelecionada.insumosUsados?.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                                <span className="detalhe-label" style={{ display: 'block', marginBottom: '6px' }}>Insumos Utilizados</span>
                                                <div className="insumos-list">
                                                    {tarefaSelecionada.insumosUsados.map(ins => (
                                                        <div key={ins.idEstoque} className="insumo-tag"><Package size={12} /> {ins.nome} — {ins.quantidade} {ins.unidadeMedida}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {tarefaSelecionada.fotoConclusao && (
                                            <div style={{ marginTop: '12px' }}>
                                                <span className="detalhe-label" style={{ display: 'block', marginBottom: '6px' }}>Foto da Execução</span>
                                                <img src={tarefaSelecionada.fotoConclusao} alt="Execução" style={{ maxWidth: '100%', borderRadius: '10px', border: '2px solid #e2e8f0' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer-tarefa">
                                <button onClick={() => setModalDetalheAberto(false)} className="link-action-tarefa">Fechar</button>
                                {pendente && temPerm && (
                                    <button onClick={() => { setModalDetalheAberto(false); abrirModalEdicao(tarefaSelecionada); }}
                                        className="btn-login-tarefa" style={{ marginTop: 0, padding: '10px 22px' }}>
                                        <Edit2 size={15} /> Editar
                                    </button>
                                )}
                                {tarefaSelecionada.emObservacao && (tarefaSelecionada.responsavel?.idUsuario === usuarioLogado.idUsuario || temPerm) && (
                                    <button onClick={(e) => { setModalDetalheAberto(false); abrirObsUpdate(e, tarefaSelecionada); }}
                                        className="btn-login-tarefa" style={{ marginTop: 0, padding: '10px 22px', background: '#f59e0b' }}>
                                        <Eye size={15} /> Acompanhamento
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ════════════════════════════════════════════
                MODAL: ACOMPANHAMENTO EM OBSERVAÇÃO
            ════════════════════════════════════════════ */}
            {modalObsUpdateAberto && tarefaSelecionada && (
                <div className="modal-modern-overlay-tarefa">
                    <div className="modal-modern-content-tarefa">
                        <div className="modal-header-premium-tarefa">
                            <div>
                                <h2>Acompanhamento</h2>
                                <p className="modal-task-subtitle">{tarefaSelecionada.titulo}</p>
                            </div>
                            <button className="btn-close-modal-tarefa" onClick={() => setModalObsUpdateAberto(false)}><X size={20} /></button>
                        </div>

                        <div className="form-premium-tarefa">
                            <div className="obs-update-banner">
                                <Eye size={16} style={{ flexShrink: 0 }} />
                                <span>Esta tarefa está <strong>Em Observação</strong>. Registre uma atualização e escolha o próximo estado.</span>
                            </div>

                            {tarefaSelecionada.observacaoConclusao && (
                                <div className="obs-anterior-box">
                                    <div className="obs-anterior-header"><History size={13} /> Último Registro</div>
                                    <p>{tarefaSelecionada.observacaoConclusao}</p>
                                    {tarefaSelecionada.fotoConclusao && (
                                        <img src={tarefaSelecionada.fotoConclusao} alt="Foto anterior" className="obs-anterior-foto" />
                                    )}
                                </div>
                            )}

                            <div className="form-group-tarefa">
                                <label className="input-label">Nova Atualização *</label>
                                <textarea className="login-input" rows="4"
                                    placeholder="Descreva o estado atual, o que foi observado, o que ainda precisa ser feito..."
                                    value={obsUpdateForm.observacao}
                                    onChange={e => setObsUpdateForm(prev => ({ ...prev, observacao: e.target.value }))} />
                            </div>

                            <div className="form-group-tarefa">
                                <label className="input-label"><Camera size={14} /> Foto Atualizada (opcional)</label>
                                {obsUpdateForm.fotoConclusao ? (
                                    <div className="foto-preview-wrapper">
                                        <img src={obsUpdateForm.fotoConclusao} alt="Preview" className="foto-preview" />
                                        <button type="button" className="btn-rm-foto" onClick={() => setObsUpdateForm(prev => ({ ...prev, fotoConclusao: null }))}>
                                            <X size={13} /> Remover foto
                                        </button>
                                    </div>
                                ) : (
                                    <label className="btn-upload-foto">
                                        <Camera size={18} /> Adicionar da Galeria
                                        <input type="file" accept="image/*" hidden onChange={handleFotoObsUpdate} />
                                    </label>
                                )}
                            </div>

                            <div className="modal-footer-tarefa">
                                <button type="button" onClick={() => setModalObsUpdateAberto(false)} className="link-action-tarefa">Cancelar</button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" className="btn-manter-obs" onClick={manterEmObservacao} disabled={carregando}>
                                        <Eye size={15} /> {carregando ? '...' : 'Manter em Observação'}
                                    </button>
                                    <button type="button" className="btn-login-tarefa" style={{ marginTop: 0, padding: '10px 18px' }} onClick={concluirDefinitivamente} disabled={carregando}>
                                        <CheckCircle2 size={15} /> {carregando ? '...' : 'Concluir Definitivamente'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: CRIAR / EDITAR TAREFA
            ════════════════════════════════════════════ */}
            {modalAberto && (
                <div className="modal-modern-overlay-tarefa">
                    <div className="modal-modern-content-tarefa">
                        <div className="modal-header-premium-tarefa">
                            <h2>{modoEdicao ? 'Editar Tarefa' : 'Nova Atribuição'}</h2>
                            <button className="btn-close-modal-tarefa" onClick={() => setModalAberto(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={salvarTarefa} className="form-premium-tarefa">
                            <div className="form-group-tarefa">
                                <label className="input-label">Título da Tarefa *</label>
                                <input className="login-input" placeholder="O que precisa ser feito?"
                                    value={novaTarefa.titulo}
                                    onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                                    required />
                            </div>

                            <div className="form-group-tarefa">
                                <label className="input-label">Descrição</label>
                                <textarea className="login-input" style={{ minHeight: '70px' }}
                                    placeholder="Contexto geral da tarefa..."
                                    value={novaTarefa.descricao}
                                    onChange={e => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })} />
                            </div>

                            <div className="form-row-tarefa">
                                <div className="form-group-tarefa">
                                    <label className="input-label">Categoria</label>
                                    <select className="login-input" value={novaTarefa.categoria}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, categoria: e.target.value, subcategoria: '' })}>
                                        <option value="">Selecione a categoria...</option>
                                        {Object.keys(CATEGORIAS_TAREFAS).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-tarefa">
                                    <label className="input-label">Subcategoria</label>
                                    <select className="login-input" value={novaTarefa.subcategoria}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, subcategoria: e.target.value })}
                                        disabled={!novaTarefa.categoria}>
                                        <option value="">Selecione...</option>
                                        {subcatsDisponiveis.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row-tarefa">
                                <div className="form-group-tarefa">
                                    <label className="input-label">Urgência</label>
                                    <select className="login-input" value={novaTarefa.prioridade}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}>
                                        <option value="BAIXA">Baixa</option>
                                        {/* <option value="MEDIA">Média</option> */}
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group-tarefa">
                                    <label className="input-label">Data Limite *</label>
                                    <input type="date" className="login-input" value={novaTarefa.dataPrazo}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, dataPrazo: e.target.value })}
                                        required />
                                </div>
                            </div>

                            <div className="form-group-tarefa">
                                <label className="input-label">Orientações / Informações Adicionais</label>
                                <textarea className="login-input" style={{ minHeight: '80px' }}
                                    placeholder="Ex: Usar EPI completo, verificar armadilha no quadrante 3, registrar quantidade encontrada..."
                                    value={novaTarefa.informacoesExtras}
                                    onChange={e => setNovaTarefa({ ...novaTarefa, informacoesExtras: e.target.value })} />
                            </div>

                            <div className="form-group-tarefa">
                                <label className="input-label">Responsável pela Execução</label>
                                <select className="login-input" value={novaTarefa.idResponsavel}
                                    onChange={e => setNovaTarefa({ ...novaTarefa, idResponsavel: e.target.value })}>
                                    <option value={usuarioLogado.idUsuario}>Atribuir a mim</option>
                                    {usuarios.filter(u => u.idUsuario !== usuarioLogado.idUsuario).map(u => (
                                        <option key={u.idUsuario} value={u.idUsuario}>{u.nomeUsuario}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row-tarefa">
                                <div className="form-group-tarefa">
                                    <label className="input-label">Talhão / Área <span style={{color:'#94a3b8',fontWeight:400}}>(opcional)</span></label>
                                    <select className="login-input" value={novaTarefa.idArea}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, idArea: e.target.value, idCultivo: '' })}>
                                        <option value="">Nenhuma área específica</option>
                                        {areas.map(a => (
                                            <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-tarefa">
                                    <label className="input-label">Cultivo Vinculado <span style={{color:'#94a3b8',fontWeight:400}}>(opcional)</span></label>
                                    <select className="login-input" value={novaTarefa.idCultivo}
                                        onChange={e => setNovaTarefa({ ...novaTarefa, idCultivo: e.target.value })}
                                        disabled={!novaTarefa.idArea}>
                                        <option value="">Nenhum cultivo específico</option>
                                        {cultivosAtivos
                                            .filter(c => !novaTarefa.idArea || String(c.areaCultivo?.idArea) === String(novaTarefa.idArea))
                                            .map(c => (
                                                <option key={c.idCultivo} value={c.idCultivo}>
                                                    {c.plantaCultivada?.nomePopular} ({c.areaCultivo?.nomeArea})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer-tarefa">
                                <button type="button" onClick={() => setModalAberto(false)} className="link-action-tarefa">
                                    Descartar
                                </button>
                                <button type="submit" className="btn-login-tarefa"
                                    style={{ marginTop: 0, padding: '10px 30px' }} disabled={carregando}>
                                    {carregando ? "Salvando..." : "Confirmar Tarefa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                MODAL: REGISTRAR EXECUÇÃO (CONCLUSÃO)
            ════════════════════════════════════════════ */}
            {modalConclusaoAberto && tarefaParaConcluir && (
                <div className="modal-modern-overlay-tarefa">
                    <div className="modal-modern-content-tarefa">
                        <div className="modal-header-premium-tarefa">
                            <div>
                                <h2>Registrar Execução</h2>
                                <p className="modal-task-subtitle">{tarefaParaConcluir.titulo}</p>
                            </div>
                            <button className="btn-close-modal-tarefa" onClick={() => setModalConclusaoAberto(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submeterConclusao} className="form-premium-tarefa">
                            {/* Caminho categoria → subcategoria */}
                            {tarefaParaConcluir.categoria && (
                                <div className="task-cat-path">
                                    <span>{tarefaParaConcluir.categoria}</span>
                                    {tarefaParaConcluir.subcategoria && (
                                        <><ChevronRight size={13} /><span>{tarefaParaConcluir.subcategoria}</span></>
                                    )}
                                </div>
                            )}

                            {/* Orientações do gestor */}
                            {tarefaParaConcluir.informacoesExtras && (
                                <div className="orientacoes-box">
                                    <StickyNote size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                                    <div>
                                        <strong>Orientações do Gestor</strong>
                                        <p>{tarefaParaConcluir.informacoesExtras}</p>
                                    </div>
                                </div>
                            )}

                            {/* Banner: vai para Observação */}
                            {vaiParaObservacao && (
                                <div className="obs-banner">
                                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                    <span>
                                        Esta atividade entrará em <strong>Observação</strong> após o registro —
                                        ela exige acompanhamento antes de ser considerada finalizada.
                                    </span>
                                </div>
                            )}

                            {/* O que foi feito */}
                            <div className="form-group-tarefa">
                                <label className="input-label">O que foi feito? *</label>
                                <textarea className="login-input" rows="3"
                                    placeholder="Descreva detalhadamente o que foi realizado, o que foi encontrado..."
                                    value={conclusaoForm.observacao}
                                    onChange={e => setConclusaoForm(prev => ({ ...prev, observacao: e.target.value }))}
                                    required />
                            </div>

                            {/* Insumos utilizados (somente para subcategorias específicas) */}
                            {precisaInsumos && (
                                <div className="form-group-tarefa">
                                    <label className="input-label"><Package size={14} /> Insumos Utilizados</label>

                                    <div className="insumo-picker-row">
                                        <select className="login-input" value={insumoSel}
                                            onChange={e => setInsumoSel(e.target.value)}>
                                            <option value="">Selecionar insumo do estoque...</option>
                                            {estoqueInsumos.map(item => (
                                                <option key={item.idEstoque} value={item.idEstoque}>
                                                    {item.nome} — {item.subcategoria || 'Insumo'} ({item.quantidadeEstoque} {item.unidadeMedida || 'un'} disp.)
                                                </option>
                                            ))}
                                        </select>
                                        <input type="number" className="login-input insumo-qty"
                                            min="1"
                                            max={estoqueInsumos.find(e => String(e.idEstoque) === String(insumoSel))?.quantidadeEstoque ?? 999}
                                            value={qtdInsumo}
                                            onChange={e => setQtdInsumo(Number(e.target.value))} />
                                        <button type="button" className="btn-add-insumo" onClick={adicionarInsumo}>
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {conclusaoForm.insumosUsados.length > 0 && (
                                        <div className="insumos-list">
                                            {conclusaoForm.insumosUsados.map(ins => (
                                                <div key={ins.idEstoque} className="insumo-tag">
                                                    <Package size={12} />
                                                    <span>{ins.nome} — {ins.quantidade} {ins.unidadeMedida}</span>
                                                    <button type="button" className="btn-rm-insumo"
                                                        onClick={() => removerInsumo(ins.idEstoque)}>
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {estoqueInsumos.length === 0 && (
                                        <p className="sem-insumos-aviso">
                                            Nenhum insumo disponível no estoque no momento.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Foto da execução */}
                            <div className="form-group-tarefa">
                                <label className="input-label"><Camera size={14} /> Foto da Execução (opcional)</label>
                                {conclusaoForm.fotoConclusao ? (
                                    <div className="foto-preview-wrapper">
                                        <img src={conclusaoForm.fotoConclusao} alt="Preview da execução" className="foto-preview" />
                                        <button type="button" className="btn-rm-foto"
                                            onClick={() => setConclusaoForm(prev => ({ ...prev, fotoConclusao: null }))}>
                                            <X size={13} /> Remover foto
                                        </button>
                                    </div>
                                ) : (
                                    <label className="btn-upload-foto">
                                        <Camera size={18} /> Adicionar da Galeria
                                        <input type="file" accept="image/*" hidden onChange={handleFoto} />
                                    </label>
                                )}
                            </div>

                            <div className="modal-footer-tarefa">
                                <button type="button" onClick={() => setModalConclusaoAberto(false)}
                                    className="link-action-tarefa">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-login-tarefa"
                                    style={{ marginTop: 0, padding: '10px 28px', background: vaiParaObservacao ? '#f59e0b' : '#16a34a' }}
                                    disabled={carregando}>
                                    {carregando ? "Registrando..." : (vaiParaObservacao ? "Enviar para Observação" : "Concluir Tarefa")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tarefas;
