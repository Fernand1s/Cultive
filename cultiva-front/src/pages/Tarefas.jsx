import { useState, useEffect } from 'react';
import '../App.css';
import '../css/tarefas.css';
import {
    Plus, Calendar, Trash2, User,
    CheckCircle2, Edit2, Ban, StickyNote, ClipboardList, X, Clock
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

import {getHeaders, request, tarefaService, userService} from "../services/api.js";

const Tarefas = () => {
    const notify = useNotify();

    const [usuarioLogado] = useState(() => {
        try {
            const dados = localStorage.getItem('usuario_logado');
            return dados ? JSON.parse(dados) : null;
        } catch (e) { return null; }
    });

    const [tarefas, setTarefas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [modalObsAberto, setModalObsAberto] = useState(false);
    const [obsTexto, setObsTexto] = useState('');
    const [tarefaParaConcluir, setTarefaParaConcluir] = useState(null);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [idTarefaEditando, setIdTarefaEditando] = useState(null);
    const [carregando, setCarregando] = useState(false);

    const [novaTarefa, setNovaTarefa] = useState({
        titulo: '', descricao: '', prioridade: 'MEDIA', categoria: '', dataPrazo: '', idResponsavel: ''
    });

    useEffect(() => {
        if (usuarioLogado?.idUsuario) {
            carregarTarefas();
            const souGestor = usuarioLogado.funcao.includes('ADMIN') || usuarioLogado.funcao.includes('GERENTE');
            if (souGestor) {
                carregarUsuarios();
            }
        }
    }, [usuarioLogado]);

    const carregarTarefas = async () => {
        try {
            const resT = await tarefaService.listar(usuarioLogado.idUsuario, usuarioLogado.funcao);
            setTarefas(resT);
        } catch (err) {
            notify("Erro ao carregar tarefas.", "error");
        }
    };

    const carregarUsuarios = async () => {
        try {
            const resU = await userService.listar();
            setUsuarios(resU);
        } catch (err) {
            console.warn("Usuário sem permissão para listar colaboradores.");
        }
    };

    const carregarDados = async () => {
        try {
            const [resT, resU] = await Promise.all([
                tarefaService.listar(usuarioLogado.idUsuario, usuarioLogado.funcao),
                userService.listar()
            ]);

            setTarefas(resT);
            setUsuarios(resU);
        } catch (err) {
            notify("Erro ao sincronizar tarefas.", "error");
        }
    };

    const handleCheckConclusao = (tarefa) => {
        if (tarefa.concluida) {
            executarRequisicaoConclusao(tarefa, "");
        } else {
            setTarefaParaConcluir(tarefa);
            setObsTexto('');
            setModalObsAberto(true);
        }
    };

    const executarRequisicaoConclusao = async (tarefa, observacao) => {
        if (carregando) return;
        setCarregando(true);

        try {
            await tarefaService.concluir(tarefa.id, usuarioLogado.idUsuario, { observacao });

            // LOG DE CONCLUSÃO
            await userService.registrarLog(
                "Conclusão de Tarefa",
                `Finalizou a tarefa: ${tarefa.titulo}`,
                usuarioLogado.idUsuario
            );

            await carregarDados();
            setModalObsAberto(false);
            notify("Tarefa concluída!", "success");
        } catch (err) {
            notify("Erro ao concluir tarefa.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const cancelarTarefa = async (id) => {
        if (carregando) return;
        const tarefa = tarefas.find(t => t.id === id);
        if (window.confirm('Deseja cancelar esta tarefa?')) {
            setCarregando(true);
            try {
                await tarefaService.cancelar(id, usuarioLogado.idUsuario);

                await userService.registrarLog(
                    "Cancelamento de Tarefa",
                    `Cancelou a tarefa: ${tarefa?.titulo || id}`,
                    usuarioLogado.idUsuario
                );

                carregarDados();
            } catch (err) {
                notify("Erro ao cancelar ou sem permissão.", "error");
            } finally {
                setCarregando(false);
            }
        }
    };

    const excluirTarefa = async (id) => {
        if (carregando) return;
        if (window.confirm('Excluir definitivamente?')) {
            setCarregando(true);
            try {
                await tarefaService.excluir(id, usuarioLogado.idUsuario);

                await userService.registrarLog(
                    "Exclusão de Tarefa",
                    `Removeu permanentemente a tarefa ID: ${id}`,
                    usuarioLogado.idUsuario
                );

                carregarDados();
                notify("Tarefa removida.", "success");
            } catch (err) {
                notify("Erro ao excluir.", "error");
            } finally {
                setCarregando(false);
            }
        }
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
            dataPrazo: dataFormatada,
            idResponsavel: parseInt(responsavelFinal)
        };

        try {
            if (modoEdicao) {
                await tarefaService.atualizar(idTarefaEditando, usuarioLogado.idUsuario, corpo);

                await userService.registrarLog(
                    "Edição de Tarefa",
                    `Editou a tarefa: ${corpo.titulo}`,
                    usuarioLogado.idUsuario
                );

                notify("Tarefa atualizada!", "success");
            } else {
                await tarefaService.criar(corpo, usuarioLogado.idUsuario, responsavelFinal);

                await userService.registrarLog(
                    "Atribuição de Tarefa",
                    `Criou a tarefa: ${corpo.titulo} para o usuário ID: ${responsavelFinal}`,
                    usuarioLogado.idUsuario
                );

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

    const renderTarefa = (tarefa, tipo) => {
        const souAdmin = usuarioLogado.funcao.includes('ADMIN') || usuarioLogado.funcao.includes('EMPRESA');
        const temPermissao = (tarefa.criador?.idUsuario === usuarioLogado.idUsuario) || souAdmin;

        const hoje = new Date().toISOString().split('T')[0];
        const prazo = tarefa.dataPrazo?.split('T')[0];
        const atrasada = !tarefa.concluida && !tarefa.cancelada && prazo < hoje;

        return (
            <div key={tarefa.id} className={`task-item ${tipo} ${atrasada ? 'atrasada' : ''}`}>
                <div className="task-status-indicator" style={{
                    background: tarefa.cancelada ? '#94a3b8' : (tarefa.concluida ? '#16a34a' : (atrasada ? '#ef4444' : '#e2e8f0'))
                }} />

                {!tarefa.cancelada && (
                    <div className="custom-checkbox-container">
                        <input type="checkbox" className="custom-checkbox" checked={tarefa.concluida} onChange={() => handleCheckConclusao(tarefa)} />
                    </div>
                )}

                <div className="task-content">
                    <div className="task-main-info">
                        <h4 className="task-title">{tarefa.titulo}</h4>
                        {!tarefa.cancelada && <span className={`priority-badge prio-${tarefa.prioridade.toLowerCase()}`}>{tarefa.prioridade}</span>}
                        {atrasada && <span className="priority-badge" style={{background:'#fee2e2', color:'#ef4444', display:'flex', alignItems:'center', gap:'3px'}}><Clock size={10}/> Atrasada</span>}
                    </div>

                    <p className="task-desc">{tarefa.descricao || 'Sem descrição.'}</p>

                    <div className="task-meta">
                        <span className="meta-tag"><Calendar size={12}/> {tarefa.dataPrazo ? new Date(tarefa.dataPrazo).toLocaleDateString() : 'Sem prazo'}</span>
                        <span className="meta-tag"><User size={12}/> {tarefa.responsavel?.nomeUsuario}</span>
                        {tarefa.observacaoConclusao && (
                            <span className="meta-tag" style={{background:'#f0fdf4', color:'#16a34a', border:'1px solid #dcfce7'}}><StickyNote size={12}/> {tarefa.observacaoConclusao}</span>
                        )}
                        <span className="meta-tag" style={{opacity: 0.6}}>Criado por: {tarefa.criador?.nomeUsuario || 'Sistema'}</span>
                    </div>
                </div>

                <div className="task-actions">
                    {!tarefa.cancelada && !tarefa.concluida && temPermissao && (
                        <button onClick={() => {
                            setModoEdicao(true);
                            setIdTarefaEditando(tarefa.id);
                            setNovaTarefa({
                                titulo: tarefa.titulo,
                                descricao: tarefa.descricao,
                                prioridade: tarefa.prioridade,
                                dataPrazo: tarefa.dataPrazo ? tarefa.dataPrazo.split('T')[0] : '',
                                idResponsavel: tarefa.responsavel?.idUsuario
                            });
                            setModalAberto(true);
                        }} className="btn-icon-sm"><Edit2 size={16}/></button>
                    )}
                    {!tarefa.cancelada && !tarefa.concluida && temPermissao && (
                        <button onClick={() => cancelarTarefa(tarefa.id)} className="btn-icon-sm warning"><Ban size={16}/></button>
                    )}
                    {temPermissao && (
                        <button onClick={() => excluirTarefa(tarefa.id)} className="btn-icon-sm danger"><Trash2 size={16}/></button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Centro de Atividades</h1>
                    <p className="dashboard-subtitle">Acompanhe e execute as demandas da fazenda.</p>
                </div>
                <button className="botao-ver" onClick={() => { setModoEdicao(false); setNovaTarefa({titulo:'', descricao:'', prioridade:'MEDIA', dataPrazo:'', idResponsavel: usuarioLogado.idUsuario}); setModalAberto(true); }}>
                    <Plus size={20} /> Nova Tarefa
                </button>
            </div>

            <div className="task-list-container">
                {tarefas.filter(t => !t.concluida && !t.cancelada).length === 0 ? (
                    <div className="empty-state-tasks">
                        <ClipboardList size={48} color="#cbd5e1" style={{marginBottom:'16px'}} />
                        <h3 style={{color:'#64748b'}}>Tudo em dia!</h3>
                        <p style={{color:'#94a3b8'}}>Você não possui tarefas pendentes para hoje.</p>
                    </div>
                ) : (
                    tarefas.filter(t => !t.concluida && !t.cancelada).map(t => renderTarefa(t, 'pendente'))
                )}
            </div>

            {tarefas.filter(t => t.concluida && !t.cancelada).length > 0 && (
                <>
                    <div className="section-divider"><span>Concluídas</span></div>
                    <div className="task-list-container">
                        {tarefas.filter(t => t.concluida && !t.cancelada).map(t => renderTarefa(t, 'completed'))}
                    </div>
                </>
            )}

            {tarefas.filter(t => t.cancelada).length > 0 && (
                <>
                    <div className="section-divider"><span>Arquivadas / Canceladas</span></div>
                    <div className="task-list-container">
                        {tarefas.filter(t => t.cancelada).map(t => renderTarefa(t, 'cancelled'))}
                    </div>
                </>
            )}

            {/* MODAL CRIAR/EDITAR */}
            {modalAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content">
                        <div className="modal-header-premium">
                            <h2>{modoEdicao ? 'Ajustar Detalhes' : 'Nova Atribuição'}</h2>
                            <X size={20} onClick={() => setModalAberto(false)} style={{cursor:'pointer'}}/>
                        </div>
                        <form onSubmit={salvarTarefa} className="form-premium">
                            <div className="form-group">
                                <label className="input-label">Título da Tarefa</label>
                                <input className="login-input" placeholder="O que precisa ser feito?" value={novaTarefa.titulo} onChange={e => setNovaTarefa({...novaTarefa, titulo: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Instruções Adicionais</label>
                                <textarea className="login-input" style={{minHeight:'80px'}} placeholder="Descreva os detalhes..." value={novaTarefa.descricao} onChange={e => setNovaTarefa({...novaTarefa, descricao: e.target.value})} />
                            </div>
                            <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                <div className="form-group">
                                    <label className="input-label">Urgência</label>
                                    <select className="login-input" value={novaTarefa.prioridade} onChange={e => setNovaTarefa({...novaTarefa, prioridade: e.target.value})}>
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Data Limite</label>
                                    <input type="date" className="login-input" value={novaTarefa.dataPrazo} onChange={e => setNovaTarefa({...novaTarefa, dataPrazo: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Responsável pela Execução</label>
                                <select
                                    className="login-input"
                                    value={novaTarefa.idResponsavel}
                                    onChange={e => setNovaTarefa({...novaTarefa, idResponsavel: e.target.value})}
                                >
                                    <option value={usuarioLogado.idUsuario}>Atribuir a mim</option>
                                    {usuarios.length > 0 && usuarios.map(u =>
                                            u.idUsuario !== usuarioLogado.idUsuario && (
                                                <option key={u.idUsuario} value={u.idUsuario}>{u.nomeUsuario}</option>
                                            )
                                    )}
                                </select>
                            </div>
                            <div className="modal-footer" style={{borderTop:'1px solid #f1f5f9', paddingTop:'20px', marginTop:'20px'}}>
                                <button type="button" onClick={() => setModalAberto(false)} className="link-action" style={{color:'#64748b'}}>Descartar</button>
                                <button type="submit" className="btn-login" style={{marginTop:0, padding:'10px 30px'}} disabled={carregando}>{carregando ? "Sincronizando..." : "Confirmar Tarefa"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL OBSERVAÇÃO */}
            {modalObsAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{maxWidth: '400px'}}>
                        <div style={{textAlign:'center', marginBottom:'20px'}}>
                            <div style={{background:'#d1fae5', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px'}}>
                                <CheckCircle2 size={24} color="#10b981" />
                            </div>
                            <h2 style={{fontSize:'1.25rem', margin:0}}>Finalizar Tarefa</h2>
                            <p style={{color:'#64748b', fontSize:'0.9rem'}}>Adicione uma nota sobre a execução.</p>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); executarRequisicaoConclusao(tarefaParaConcluir, obsTexto); }}>
                            <textarea className="login-input" rows="3" placeholder="Ex: Tudo pronto, irrigação verificada." value={obsTexto} onChange={e => setObsTexto(e.target.value)} />
                            <div className="modal-footer" style={{marginTop:'20px'}}>
                                <button type="button" onClick={() => setModalObsAberto(false)} className="link-action">Voltar</button>
                                <button type="submit" className="btn-login" style={{marginTop:0, background:'#10b981'}} disabled={carregando}> {carregando ? "Finalizando..." : "Concluir Agora"} </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tarefas;