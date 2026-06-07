import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService, notificationService, userService } from '../services/api';
import '../css/DashboardLayout.css';
import {
    Home, MapPin, Sprout, Wheat, BarChart3, Warehouse,
    CheckSquare, Shield, LogOut, Bell, User,
    ChevronLeft, ChevronRight, Trash2, MailOpen, Mail, CheckCircle2, Mail as MailIcon, HelpCircle
} from 'lucide-react';

export const DashboardLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificacoes, setNotificacoes] = useState([]);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [confirmExclusao, setConfirmExclusao] = useState({ show: false, id: null });
    const [fotoPerfil, setFotoPerfil] = useState(null);

    const usuario = authService.obterUsuarioLogado();

    // Carrega foto de perfil: do localStorage (novo login) ou do servidor (sessão existente)
    useEffect(() => {
        const foto = usuario?.fotoPerfil;
        if (foto) {
            setFotoPerfil(foto);
        } else {
            const id = usuario?.idUsuario || usuario?.id;
            if (id) {
                userService.obterPorId(id)
                    .then(dados => { if (dados.fotoPerfil) setFotoPerfil(dados.fotoPerfil); })
                    .catch(() => {});
            }
        }
    }, []);

    // Efeito para fechar menus ao clicar fora
    useEffect(() => {
        const handleClickFora = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    // Busca notificações ao montar o componente ou mudar usuário
    useEffect(() => {
        const id = usuario?.idUsuario || usuario?.id;
        if (id) buscarNotificacoes();
    }, [usuario?.idUsuario, usuario?.id]);

    // Controle de redimensionamento da tela
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Busca e ordena notificações
    const buscarNotificacoes = async () => {
        const idUsuario = usuario?.idUsuario || usuario?.id;
        if (!idUsuario) return;

        try {
            const contagem = await notificationService.contarNaoLidas(idUsuario);
            setTotalNaoLidas(contagem);

            const lista = await notificationService.listar(idUsuario);
            if (Array.isArray(lista)) {
                const ordenadas = lista.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
                setNotificacoes(ordenadas);
            }
        } catch (error) {
            console.error("Erro ao sincronizar notificações", error);
        }
    };

    // Marcar uma única notificação como lida
    const handleAlternarStatusLida = async (id, statusAtual) => {
        try {
            if (statusAtual) {
                await notificationService.marcarNaoLida(id);
            } else {
                await notificationService.marcarLida(id);
            }
            await buscarNotificacoes();
        } catch (error) {
            console.error("Erro ao alterar status", error);
        }
    };

    // Marcar todas como lidas/não lidas
    const handleMarcarTodasStatus = async (marcarComoLida) => {
        const idUsuario = usuario?.idUsuario || usuario?.id;
        if (!idUsuario) return;

        try {
            if (marcarComoLida) {
                await notificationService.marcarTodasLidas(idUsuario);
            } else {
                await notificationService.marcarTodasNaoLidas(idUsuario);
            }
            buscarNotificacoes();
        } catch (error) {
            console.error("Erro ao alterar todas", error);
        }
    };

    const handleLogout = () => { authService.logout(); navigate('/login'); };
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const closeSidebarMobile = () => {
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    return (
        <div className="dashboard-container">
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Modal de Exclusão */}
            {confirmExclusao.show && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content confirm-modal">
                        <div className="icon-warning-container"><Trash2 size={32} /></div>
                        <h3 className="dashboard-title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Excluir Aviso?</h3>
                        <p className="text-secondary" style={{ textAlign: 'center', margin: '10px 0 20px' }}>Esta ação removerá a notificação permanentemente.</p>
                        <div className="modal-footer-confirm">
                            <button className="btn-outline" onClick={() => setConfirmExclusao({ show: false, id: null })}>Cancelar</button>
                            <button className="btn-danger" onClick={async () => {
                                await notificationService.excluir(confirmExclusao.id);
                                setConfirmExclusao({ show: false, id: null });
                                buscarNotificacoes();
                            }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header-toggle">
                    <button className="toggle-btn-premium" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div onClick={closeSidebarMobile} className="nav-section">
                        <NavItem to="/dashboard" icon={<Home size={20}/>} label="Dashboard" active={isActive('/dashboard')} open={isSidebarOpen} />
                        <NavItem to="/areas" icon={<MapPin size={20}/>} label="Áreas" active={isActive('/areas')} open={isSidebarOpen} />
                        <NavItem to="/plantas" icon={<Sprout size={20}/>} label="Plantas" active={isActive('/plantas')} open={isSidebarOpen} />
                        <NavItem to="/cultivos" icon={<Wheat size={20}/>} label="Cultivos" active={isActive('/cultivos')} open={isSidebarOpen} />
                        <NavItem to="/estoque" icon={<Warehouse size={20}/>} label="Estoque" active={isActive('/estoque')} open={isSidebarOpen} />
                        <NavItem to="/tarefas" icon={<CheckSquare size={20}/>} label="Tarefas" active={isActive('/tarefas')} open={isSidebarOpen} />
                        <NavItem to="/relatorios" icon={<BarChart3 size={20}/>} label="Relatórios" active={isActive('/relatorios')} open={isSidebarOpen} />
                    </div>

                    {(usuario?.funcao === 'ADMINISTRADOR' || usuario?.funcao === 'EMPRESA') && (
                        <>
                            <div className="sidebar-premium-divider">
                                {isSidebarOpen ? <span>ADMINISTRAÇÃO</span> : <div className="divider-line" />}
                            </div>
                            <NavItem to="/admin" icon={<Shield size={20}/>} label="Painel de Controle" active={isActive('/admin')} open={isSidebarOpen} />
                        </>
                    )}

                     <div onClick={closeSidebarMobile}>
                        <NavItem to="/suporte" icon={<HelpCircle size={20}/>} label="Suporte" active={isActive('/suporte')} open={isSidebarOpen} />
                    </div>
                </nav>
            </aside>

            {/* HEADER */}
            <header className={`top-header-premium ${isSidebarOpen ? 'header-expanded' : 'header-collapsed'}`}>
                <div className="header-brand-section">
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <ChevronLeft size={24} /> : <div className="hamburger-icon"></div>}
                    </button>

                    <div className="header-logo-container">
                        <Sprout size={28} color="white" className="logo-icon-premium" />
                        <span className="logo-text-header">Cultive<span className="v-soft-text">+</span></span>
                    </div>

                    <div className="header-v-divider opacity-20 hiding-mobile"></div>
                    <span className="breadcrumb-simple hiding-mobile">
                        {location.pathname.split('/')[1] || 'Dashboard'}
                    </span>
                </div>

                <div className="header-actions">
                    <div className="dropdown-wrapper" ref={notificationRef}>
                        <button className={`icon-trigger-premium ${showNotifications ? 'active' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                            <Bell size={20} />
                            {totalNaoLidas > 0 && (
                                <span className="badge-premium">
                                    {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notifications-dropdown-premium">
                                <div className="drop-header-premium">
                                    <h3>Notificações</h3>
                                    <div className="header-actions-notif">
                                        {totalNaoLidas > 0 ? (
                                            <button className="mark-all-btn" onClick={() => handleMarcarTodasStatus(true)}>
                                                <CheckCircle2 size={14} /> Ler todas
                                            </button>
                                        ) : notificacoes.length > 0 && (
                                            <button className="mark-all-btn" onClick={() => handleMarcarTodasStatus(false)}>
                                                <Mail size={14} /> Marcar como não lidas
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="drop-body-premium">
                                    {notificacoes.length === 0 ? (
                                        <div className="empty-notif">
                                            <Mail size={32} />
                                            <p>Sem notificações</p>
                                        </div>
                                    ) : (
                                        notificacoes.map(n => (
                                            <div key={n.id} className={`notif-card ${!n.lida ? 'unread' : ''}`}>
                                                <div className="notif-content">
                                                    <div className="notif-title-row">
                                                        <h4>{n.titulo}</h4>
                                                        {!n.lida && <span className="unread-dot"></span>}
                                                    </div>
                                                    <p>{n.mensagem}</p>
                                                    <div className="notif-footer-row">
                                                        <span className="notif-time">
                                                            {new Date(n.dataHora).toLocaleDateString()} às {new Date(n.dataHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>

                                                        <button
                                                            className={`status-toggle-btn ${n.lida ? 'is-read' : 'is-unread'}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation(); // ESSENCIAL: Impede que o clique suba para o card
                                                                handleAlternarStatusLida(n.id, n.lida);
                                                            }}
                                                            title={n.lida ? "Marcar como não lida" : "Marcar como lida"}
                                                        >
                                                            {n.lida ? (
                                                                <><Mail size={14} /> <span>Não lida</span></>
                                                            ) : (
                                                                <><MailOpen size={14} /> <span>Lida</span></>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    className="delete-notif-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmExclusao({show: true, id: n.id});
                                                    }}
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="header-v-divider"></div>

                    <div className="user-profile-premium" ref={userMenuRef} onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="user-meta-info">
                            <span className="u-name">{usuario?.nomeUsuario || 'Usuário'}</span>
                            <span className="u-role">{usuario?.funcao}</span>
                        </div>
                        <div className="u-avatar-premium">
                            {fotoPerfil
                                ? <img src={fotoPerfil} alt="" className="u-avatar-foto" />
                                : (usuario?.nomeUsuario?.charAt(0) || <User size={18}/>)
                            }
                        </div>

                        {showUserMenu && (
                            <div className="user-menu-dropdown">
                                <Link to="/perfil" className="menu-item"><User size={16}/> Meu Perfil</Link>
                                <button onClick={handleLogout} className="menu-item text-danger"><LogOut size={16}/> Encerrar Sessão</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={`main-content-premium ${isSidebarOpen ? 'content-expanded' : 'content-collapsed'}`}>
                <div className="page-transition-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, icon, label, active, open }) => (
    <Link to={to} className={`nav-link-premium ${active ? 'active' : ''}`} title={!open ? label : ''}>
        <span className="nav-icon-container">{icon}</span>
        <span className={`nav-label-text ${!open ? 'text-hidden' : ''}`}>{label}</span>
    </Link>
);