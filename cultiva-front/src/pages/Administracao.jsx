import React, { useState, useEffect, useMemo, useRef } from 'react';
import { userService, authService } from '../services/api';
import '../App.css';
import '../css/Administracao.css';
import {
    UserPlus, Trash2, Search, Edit, Ban, CheckCircle,
    X, ShieldAlert, FileText, Key, AlertCircle,
    Users, Activity, Lock, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';

// Importação do sistema de notificações
import { useNotify } from "../context/NotificationContext";

const TIPOS_USUARIO = {
    ADMINISTRADOR: "Administrador",
    GERENTE_PRODUCAO: "Gerente de Produção",
    ENGENHEIRO_AGRONOMO: "Engenheiro Agrônomo",
    TECNICO_AGRICOLA: "Técnico Agrícola",
    OPERADOR_MAQUINAS: "Operador de Máquinas"
};

const Administracao = () => {
    const notify = useNotify();
    const searchInputRef = useRef(null);

    // --- ESTADOS ---
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [termoBusca, setTermoBusca] = useState('');

    const [modalAberta, setModalAberta] = useState(false);
    const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
    const [formData, setFormData] = useState({ nome: '', email: '', tipo: 'TECNICO_AGRICOLA' });

    const [modalCodigo, setModalCodigo] = useState(false);
    const [codigoGerado, setCodigoGerado] = useState('');
    const [usuarioNomeCodigo, setUsuarioNomeCodigo] = useState('');

    const [logs, setLogs] = useState([]);
    const [modalLogsOpen, setModalLogsOpen] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({ aberta: false, id: null, nome: '' });
    const [confirmacaoLogoutGeral, setConfirmacaoLogoutGeral] = useState(false);

    const [filtroLogUsuario, setFiltroLogUsuario] = useState('');
    const [filtroLogAcao, setFiltroLogAcao] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');
    const [datasExpandidas, setDatasExpandidas] = useState({});

    const [salvando, setSalvando] = useState(false);

    // --- BUSCAR USUÁRIOS ---
    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const dados = await userService.listar();
            const dadosFormatados = dados.map(u => ({
                ...u,
                id: u.idUsuario || u.id,
                nome: u.nomeUsuario || u.nome,
                tipo: u.funcao || u.tipo || 'TECNICO_AGRICOLA'
            }));
            setUsuarios(dadosFormatados);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            notify("Erro ao carregar lista de usuários.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- BUSCAR LOGS ---
    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            let dadosLogs = [];
            if (userService && typeof userService.listarLogs === 'function') {
                const rawLogs = await userService.listarLogs();
                dadosLogs = rawLogs.map(log => ({
                    id: log.id || Math.random(),
                    dataHora: log.dataHora || new Date().toISOString(),
                    usuarioIdentificador: log.usuario || log.nomeUsuario || log.idUsuario || 'Sistema',
                    acao: log.acao || log.descricao || 'Ação registrada'
                }));
            } else {
                notify("O serviço de logs ainda não foi implementado na API.", "info");
                return;
            }

            dadosLogs.sort((a, b) => {
                const dataA = new Date(Array.isArray(a.dataHora) ? new Date(a.dataHora[0], a.dataHora[1]-1, a.dataHora[2], a.dataHora[3]||0, a.dataHora[4]||0) : a.dataHora);
                const dataB = new Date(Array.isArray(b.dataHora) ? new Date(b.dataHora[0], b.dataHora[1]-1, b.dataHora[2], b.dataHora[3]||0, b.dataHora[4]||0) : b.dataHora);
                return dataB - dataA;
            });

            const logsLimpos = dadosLogs.filter((log) => {
                const acaoLower = log.acao.toLowerCase();
                const ruidosIgnorar = ['keep-alive', 'heartbeat', 'polling'];
                return !ruidosIgnorar.some(r => acaoLower.includes(r));
            });

            setLogs(logsLimpos);
            if (logsLimpos.length > 0) {
                const primeiraData = formatarDataSimples(logsLimpos[0].dataHora);
                setDatasExpandidas({ [primeiraData]: true });
            }
            setModalLogsOpen(true);
        } catch (error) {
            notify("Erro ao carregar o histórico de logs.", "error");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // --- FORMATADORES ---
    const formatarDataSimples = (dataInput) => {
        if (!dataInput) return "Data Desconhecida";
        try {
            let dataObj;
            if (Array.isArray(dataInput)) {
                dataObj = new Date(dataInput[0], dataInput[1] - 1, dataInput[2]);
            } else {
                dataObj = new Date(dataInput);
            }
            return dataObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return "Data Inválida"; }
    };

    const formatarHora = (dataInput) => {
        try {
            let dataObj;
            if (Array.isArray(dataInput)) {
                dataObj = new Date(dataInput[0], dataInput[1]-1, dataInput[2], dataInput[3]||0, dataInput[4]||0);
            } else {
                dataObj = new Date(dataInput);
            }
            return dataObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return "--:--"; }
    };

    const resolverNomeAtor = (identificador) => {
        if (!identificador) return "Usuário";
        const identStr = String(identificador).toLowerCase();
        if (identStr === 'admin' || identStr === 'sistema') return 'Sistema/Admin';
        const usuarioEncontrado = usuarios.find(u =>
            String(u.id) === identStr ||
            (u.email && u.email.toLowerCase() === identStr) ||
            (u.nome && u.nome.toLowerCase() === identStr)
        );
        return usuarioEncontrado ? usuarioEncontrado.nome : identificador;
    };

    const formatarMensagemLog = (acao) => {
        const regexId = /(?:usuário\s+)?(?:ID:|id)\s*(\d+)/i;
        const match = acao.match(regexId);
        let acaoFormatada = acao;
        if (match && usuarios.length > 0) {
            const idAlvo = parseInt(match[1]);
            const usuarioAlvo = usuarios.find(u => u.id === idAlvo);
            if (usuarioAlvo) acaoFormatada = acao.replace(match[0], `"${usuarioAlvo.nome}"`);
        }
        return acaoFormatada.replace(/usuário\s+o\s+usuário/gi, 'o usuário');
    };

    // --- AGRUPAMENTO ---
    const logsAgrupados = useMemo(() => {
        return logs.filter(log => {
            let dataLog;
            if (Array.isArray(log.dataHora)) {
                dataLog = new Date(log.dataHora[0], log.dataHora[1]-1, log.dataHora[2]);
            } else {
                dataLog = new Date(log.dataHora);
            }
            dataLog.setHours(0,0,0,0);
            if (filtroDataInicio && dataLog < new Date(filtroDataInicio + "T00:00:00")) return false;
            if (filtroDataFim && dataLog > new Date(filtroDataFim + "T23:59:59")) return false;
            const atorNome = resolverNomeAtor(log.usuarioIdentificador);
            const acaoFormatada = formatarMensagemLog(log.acao);
            const matchUser = String(atorNome).toLowerCase().includes(filtroLogUsuario.toLowerCase()) ||
                String(log.usuarioIdentificador).toLowerCase().includes(filtroLogUsuario.toLowerCase());
            const matchAcao = acaoFormatada.toLowerCase().includes(filtroLogAcao.toLowerCase());
            return matchUser && matchAcao;
        }).reduce((grupos, log) => {
            const dataStr = formatarDataSimples(log.dataHora);
            if (!grupos[dataStr]) grupos[dataStr] = [];
            grupos[dataStr].push(log);
            return grupos;
        }, {});
    }, [logs, filtroLogUsuario, filtroLogAcao, filtroDataInicio, filtroDataFim, usuarios]);

    const toggleData = (dataStr) => {
        setDatasExpandidas(prev => ({ ...prev, [dataStr]: !prev[dataStr] }));
    };

    // --- UI HELPERS ---
    const focarBuscaUsuario = () => searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) || searchInputRef.current?.focus();
    const abrirModalCriacao = () => { setUsuarioEmEdicao(null); setFormData({ nome: '', email: '', tipo: 'TECNICO_AGRICOLA' }); setModalAberta(true); };
    const abrirModalEdicao = (user) => { setUsuarioEmEdicao(user); setFormData({ nome: user.nome, email: user.email, tipo: user.tipo }); setModalAberta(true); };
    const fecharModal = () => { setModalAberta(false); setUsuarioEmEdicao(null); setFormData({ nome: '', email: '', tipo: 'TECNICO_AGRICOLA' })};
    const getIniciais = (nome) => nome ? nome.substring(0, 2).toUpperCase() : '??';

    // --- AÇÕES DO SISTEMA ---
    const handleSalvar = async () => {
        if (salvando) return;
        if (!formData.nome || !formData.email) {
            notify("Preencha todos os campos obrigatórios.", "error");
            return;
        }

        setSalvando(true);
        try {

            const usuarioLogado = authService.obterUsuarioLogado();

            const usuarioParaSalvar = {
                nomeUsuario: formData.nome,
                email: formData.email,
                funcao: formData.tipo,
                ativo: true
            };
            if (usuarioEmEdicao) {
                await userService.atualizar(usuarioEmEdicao.id, usuarioParaSalvar);
                await userService.registrarLog(
                    `Editou usuário: ${formData.nome}`,
                    `Alterou dados do usuário ID ${usuarioEmEdicao.id}`,
                    usuarioLogado.idUsuario || usuarioLogado.id
                );

                notify("Usuário atualizado com sucesso!", "success");
                setSalvando(false);
            } else {
                const novoUsuario = await userService.criar(usuarioParaSalvar);

                await userService.registrarLog(
                    `Criou novo usuário: ${formData.nome}`,
                    `Cadastrou usuário com e-mail ${formData.email}`,
                    usuarioLogado.idUsuario || usuarioLogado.id
                );

                notify(`Usuário criado! Senha padrão: CultivaMais@2026`, "success");
                setSalvando(false);
            }
            await fetchUsuarios();
            fecharModal();
        } catch (error) {
            notify("Erro ao salvar: " + (error.response?.data?.message || error.message), "error");
        }
    };

    const toggleStatus = async (user) => {
        const usuarioLogado = authService.obterUsuarioLogado();
        if ((usuarioLogado?.idUsuario || usuarioLogado?.id) === user.id) {
            notify("Você não pode bloquear a si mesmo.", "error");
            return;
        }
        const novoStatus = !user.ativo;
        const acaoTexto = novoStatus ? 'Desbloqueado' : 'Bloqueado';
        try {
            const usuarioLogado = authService.obterUsuarioLogado();
            await userService.atualizar(user.id, {
                ativo: novoStatus,
                contexto: 'alteracao_status',
                acaoLog: novoStatus ? 'Desbloquear' : 'Bloquear'
            });

            await userService.registrarLog(
                `${user.ativo ? 'Bloqueou' : 'Desbloqueou'} usuário: ${user.nome}`,
                `Status alterado para ${!user.ativo}`,
                usuarioLogado.idUsuario || usuarioLogado.id
            );

            notify(`Usuário ${user.nome} ${acaoTexto.toLowerCase()}!`, "info");
            fetchUsuarios();
        } catch (error) {
            notify(`Erro ao alterar status do usuário.`, "error");
        } finally {
            setSalvando(false);
        }
    };

    const executarExclusao = async () => {
        try {
            const usuarioLogado = authService.obterUsuarioLogado();

            await userService.excluir(confirmacaoExclusao.id);

            await userService.registrarLog(
                `Excluiu usuário: ${confirmacaoExclusao.nome}`,
                `Remoção permanente do ID ${confirmacaoExclusao.id}`,
                usuarioLogado.idUsuario || usuarioLogado.id
            );

            notify(`Usuário ${confirmacaoExclusao.nome} removido.`, "success");
            setConfirmacaoExclusao({ aberta: false, id: null, nome: '' });
            fetchUsuarios();
        } catch (error) {
            notify("Erro ao excluir usuário.", "error");
        }
    };

    const handleGerarCodigoSenha = async (user) => {
        try {
            const resposta = await userService.gerarCodigo(user.email);
            setCodigoGerado(typeof resposta === 'object' ? resposta.codigo : resposta);
            setUsuarioNomeCodigo(user.nome);
            setModalCodigo(true);
            notify("Código de recuperação gerado.", "success");
        } catch (error) {
            notify("Erro ao gerar código.", "error");
        }
    };

    const executarLogoutGeral = () => {
        setConfirmacaoLogoutGeral(false);
        notify("Comando de logout global enviado com sucesso.", "success");
    };

    const usuariosFiltrados = usuarios.filter(u =>
        (u.nome && u.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(termoBusca.toLowerCase()))
    );

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h2 className="dashboard-title">Administração</h2>
                    <p className="dashboard-subtitle">Gestão de acessos e segurança.</p>
                </div>
                <button className="botao-ver" onClick={abrirModalCriacao}>
                    <UserPlus size={18} /> Novo Usuário
                </button>
            </div>

            <div className="admin-shortcuts-grid">
                <div onClick={focarBuscaUsuario} className="shortcut-card blue">
                    <div>
                        <h3 className="shortcut-title">Gerenciar Usuários</h3>
                        <p className="dashboard-subtitle">Buscar e editar equipe.</p>
                    </div>
                    <div className="icon-circle blue"><Users size={24} /></div>
                </div>
                <div onClick={fetchLogs} className="shortcut-card green">
                    <div>
                        <h3 className="shortcut-title">Histórico de Logs</h3>
                        <p className="dashboard-subtitle">Auditoria de ações.</p>
                    </div>
                    <div className="icon-circle green"><Activity size={24} /></div>
                </div>
                <div onClick={() => setConfirmacaoLogoutGeral(true)} className="shortcut-card orange">
                    <div>
                        <h3 className="shortcut-title">Segurança Global</h3>
                        <p className="dashboard-subtitle">Controle de sessão.</p>
                    </div>
                    <div className="icon-circle orange"><Lock size={24} /></div>
                </div>
            </div>

            <div className="filter-card">
                <div className="filter-title">
                    <Search size={18} className="text-muted" style={{ marginRight: '8px' }} />
                    Filtrar Equipe
                </div>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    className="form-input"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </div>

            {loading ? <div className="loading-container">Carregando...</div> : (
                <div className="users-grid">
                    {usuariosFiltrados.map((user) => (
                        <div key={user.id} className="user-card" style={{ opacity: user.ativo ? 1 : 0.6 }}>
                            <button className="btn-delete-user" onClick={() => setConfirmacaoExclusao({ aberta: true, id: user.id, nome: user.nome })} title="Excluir">
                                <Trash2 size={18} />
                            </button>
                            <div className={`user-avatar-lg ${user.tipo === 'ADMINISTRADOR' ? 'avatar-admin' : 'avatar-tecnico'}`}>
                                {getIniciais(user.nome)}
                            </div>
                            <div className="user-info-content">
                                <h3>{user.nome}</h3>
                                <span className="user-email">{user.email}</span>
                                <div className="role-badges-container">
                                    <span className={`role-badge ${user.tipo === 'ADMINISTRADOR' ? 'role-admin' : 'role-tecnico'}`}>
                                        {TIPOS_USUARIO[user.tipo] || user.tipo}
                                    </span>
                                    {!user.ativo && <span className="role-badge blocked">BLOQUEADO</span>}
                                </div>
                                <div className="user-actions-footer">
                                    <button className="btn-outline-sm" onClick={() => abrirModalEdicao(user)} title="Editar"><Edit size={18} /></button>
                                    <button className="btn-outline-sm" onClick={() => handleGerarCodigoSenha(user)} title="Gerar Código"><Key size={18} color="#eab308" /></button>
                                    <button className="btn-outline-sm" onClick={() => toggleStatus(user)} title={user.ativo ? "Bloquear" : "Desbloquear"}>
                                        {user.ativo ? <Ban size={18} color="#ef4444" /> : <CheckCircle size={18} color="#16a34a" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {confirmacaoExclusao.aberta && (
                <div className="modal-modern-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-modern-content confirm-modal">
                        <div className="icon-warning-container"><AlertCircle size={32} /></div>
                        <h3 className="modal-confirm-title">Excluir Usuário?</h3>
                        <p className="modal-confirm-desc">Deseja realmente remover o usuário <strong>{confirmacaoExclusao.nome}</strong>? Esta ação não pode ser desfeita.</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoExclusao({ aberta: false, id: null, nome: '' })}>Cancelar</button>
                            <button className="btn-danger" onClick={executarExclusao}>Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMAÇÃO LOGOUT GERAL */}
            {confirmacaoLogoutGeral && (
                <div className="modal-modern-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-modern-content confirm-modal">
                        <div className="icon-lock-container"><Lock size={32} /></div>
                        <h3 className="modal-confirm-title">Logout Global</h3>
                        <p className="modal-confirm-desc">Deseja desconectar todos os usuários ativos no sistema agora?</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmacaoLogoutGeral(false)}>Cancelar</button>
                            <button className="btn-warning" onClick={executarLogoutGeral}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CRIAR/EDITAR */}
            {modalAberta && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content">
                        <div className="modal-header-flex">
                            <h2 className="modal-title">{usuarioEmEdicao ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            <button onClick={fecharModal} className="btn-close-modal"><X size={24} /></button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input className="form-input" placeholder="Nome completo do colaborador" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input className="form-input" placeholder="exemplo@cultivamais.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Função</label>
                            <select className="form-select" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                                {Object.entries(TIPOS_USUARIO).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-outline" onClick={fecharModal}>Cancelar</button>
                            <button className="botao-ver" onClick={handleSalvar}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CÓDIGO SENHA */}
            {modalCodigo && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content code-modal">
                        <h2 className="modal-title">Código para {usuarioNomeCodigo}</h2>
                        <div className="generated-code-display">{codigoGerado}</div>
                        <button className="botao-ver" onClick={() => setModalCodigo(false)}>Fechar</button>
                    </div>
                </div>
            )}

            {/* MODAL LOGS */}
            {modalLogsOpen && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content logs-modal">
                        <div className="modal-header-flex">
                            <div className="header-icon-title">
                                <FileText size={24} color="#0f172a" />
                                <div>
                                    <h2 className="modal-title">Auditoria e rastreabilidade</h2>
                                </div>
                            </div>
                            <button onClick={() => setModalLogsOpen(false)} className="btn-close-modal"><X size={24} /></button>
                        </div>

                        <div className="logs-filter-section">
                            <div className="filter-row">
                                <div className="filter-col">
                                    <label className="filter-label">Quem (Ator)</label>
                                    <div className="input-with-icon">
                                        <Search size={16} />
                                        <input type="text" className="form-input-sm" placeholder="Nome..." value={filtroLogUsuario} onChange={(e) => setFiltroLogUsuario(e.target.value)} />
                                    </div>
                                </div>
                                <div className="filter-col">
                                    <label className="filter-label">O que (Ação/Alvo)</label>
                                    <div className="input-with-icon">
                                        <Activity size={16} />
                                        <input type="text" className="form-input-sm" placeholder="Ex: Bloqueou, Login, ID..." value={filtroLogAcao} onChange={(e) => setFiltroLogAcao(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="filter-row border-top">
                                <div className="filter-col">
                                    <label className="filter-label">De</label>
                                    <div className="input-with-icon">
                                        <Calendar size={16} />
                                        <input type="date" className="form-input-sm" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
                                    </div>
                                </div>
                                <div className="filter-col">
                                    <label className="filter-label">Até</label>
                                    <div className="input-with-icon">
                                        <Calendar size={16} />
                                        <input type="date" className="form-input-sm" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="log-list-container">
                            {Object.keys(logsAgrupados).length === 0 ? (
                                <div className="empty-logs">
                                    <ShieldAlert size={40} />
                                    <p>Nenhum registro encontrado.</p>
                                </div>
                            ) : (
                                Object.keys(logsAgrupados).map((data) => (
                                    <div key={data} className="log-group">
                                        <button onClick={() => toggleData(data)} className="log-group-header">
                                            <span className="log-date-label">📅 {data} <span className="log-count-badge">{logsAgrupados[data].length}</span></span>
                                            {datasExpandidas[data] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        {datasExpandidas[data] && (
                                            <div className="log-items-list">
                                                {logsAgrupados[data].map((log) => {
                                                    const atorNome = resolverNomeAtor(log.usuarioIdentificador);
                                                    return (
                                                        <div key={log.id} className="log-item">
                                                            <div className="log-time">{formatarHora(log.dataHora)}</div>
                                                            <div className="log-actor">
                                                                <div className="log-actor-avatar">{atorNome.substring(0,2).toUpperCase()}</div>
                                                                <span className="log-actor-name" title={atorNome}>{atorNome}</span>
                                                            </div>
                                                            <div className="log-message">{formatarMensagemLog(log.acao)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="botao-ver" onClick={() => setModalLogsOpen(false)}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Administracao;