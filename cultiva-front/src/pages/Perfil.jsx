import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Save, Key,
    Bell, CheckCircle, AlertCircle, Lock, Eye, EyeOff, Check, X
} from 'lucide-react';
import { userService, authService } from '../services/api';
import { useNotify } from "../context/NotificationContext";
import '../css/Perfil.css';

const Perfil = () => {
    const notify = useNotify();
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('dados');

    // Estados para visibilidade de senha
    const [verSenhaAtual, setVerSenhaAtual] = useState(false);
    const [verNovaSenha, setVerNovaSenha] = useState(false);

    // Objeto vindo do Banco
    const [usuarioBanco, setUsuarioBanco] = useState(null);

    // Estado do formulário
    const [formulario, setFormulario] = useState({
        nomeUsuario: '',
        email: ''
    });

    const [dadosSenha, setDadosSenha] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });

    // --- VALIDAÇÃO EM TEMPO REAL (Padrão de Segurança) ---
    const requisitos = {
        tamanho: dadosSenha.novaSenha.length >= 8,
        maiuscula: /[A-Z]/.test(dadosSenha.novaSenha),
        minuscula: /[a-z]/.test(dadosSenha.novaSenha),
        numero: /[0-9]/.test(dadosSenha.novaSenha),
        especial: /[@#$%^&+=!]/.test(dadosSenha.novaSenha)
    };
    const isSenhaValida = Object.values(requisitos).every(v => v);

    useEffect(() => {
        const sessao = authService.obterUsuarioLogado();
        const idParaBuscar = sessao?.idUsuario;

        if (idParaBuscar) {
            carregarDadosDoServidor(idParaBuscar);
        } else {
            notify('Sessão inválida. Faça login novamente.', 'error');
            setCarregando(false);
        }
    }, []);

    const carregarDadosDoServidor = async (id) => {
        try {
            const dados = await userService.obterPorId(id);
            setUsuarioBanco(dados);
            setFormulario({
                nomeUsuario: dados.nomeUsuario || '',
                email: dados.email || ''
            });
        } catch (error) {
            notify('Erro ao conectar com o servidor.', 'error');
        } finally {
            setCarregando(false);
        }
    };

    const handleSalvarDados = async (e) => {
        e.preventDefault();
        try {
            const id = usuarioBanco.idUsuario;
            await userService.atualizar(id, {
                nomeUsuario: formulario.nomeUsuario,
                email: formulario.email
            });

            const sessaoAtual = authService.obterUsuarioLogado();
            const novaSessao = {
                ...sessaoAtual,
                nomeUsuario: formulario.nomeUsuario,
                email: formulario.email
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(novaSessao));

            notify('Perfil salvo com sucesso!', 'success');
        } catch (error) {
            notify('Erro ao salvar alterações.', 'error');
        }
    };

    const handleAlterarSenha = async (e) => {
        e.preventDefault();

        if (!dadosSenha.senhaAtual) {
            notify('Você precisa confirmar sua senha atual.', 'error');
            return;
        }

        if (!isSenhaValida) {
            notify('A nova senha não atende aos requisitos de segurança.', 'error');
            return;
        }

        if (dadosSenha.novaSenha !== dadosSenha.confirmarSenha) {
            notify('As senhas não conferem.', 'error');
            return;
        }

        try {
            const id = usuarioBanco.idUsuario;
            // Aqui enviamos a senhaAtual para validação no Back-end junto com a nova
            await userService.atualizar(id, {
                senhaAtual: dadosSenha.senhaAtual,
                senha: dadosSenha.novaSenha
            });

            notify('Senha alterada com sucesso!', 'success');
            setDadosSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        } catch (error) {
            const msg = error.response?.data?.message || 'Senha atual incorreta ou erro no servidor.';
            notify(msg, 'error');
        }
    };

    const RequisitoItem = ({ valido, texto }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem',
            color: valido ? '#16a34a' : '#94a3b8', marginBottom: '4px'
        }}>
            {valido ? <Check size={14} /> : <X size={14} />}
            <span>{texto}</span>
        </div>
    );

    if (carregando) return <div className="perfil-loading">Carregando...</div>;

    return (
        <div className="perfil-container">
            <div className="perfil-header">
                <div className="header-content">
                    <div className="avatar-circle">
                        <User size={40} color="#166534" />
                    </div>
                    <div className="user-info-header">
                        <h2>{formulario.nomeUsuario || 'Usuário'}</h2>
                        <span className="role-badge">
                            {usuarioBanco?.funcao || 'USUARIO'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="perfil-grid">
                <div className="perfil-sidebar">
                    <button className={`menu-btn ${abaAtiva === 'dados' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('dados')}>
                        <User size={18} /> Dados Pessoais
                    </button>
                    <button className={`menu-btn ${abaAtiva === 'seguranca' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('seguranca')}>
                        <Key size={18} /> Segurança
                    </button>
                    <button className={`menu-btn ${abaAtiva === 'preferencias' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('preferencias')}>
                        <Bell size={18} /> Preferências
                    </button>
                </div>

                <div className="perfil-content">
                    {abaAtiva === 'dados' && (
                        <form onSubmit={handleSalvarDados} className="fade-in">
                            <h3>Informações Básicas</h3>
                            <div className="form-group">
                                <label>Nome de Usuário</label>
                                <div className="input-icon">
                                    <User size={16} />
                                    <input type="text" value={formulario.nomeUsuario} onChange={(e) => setFormulario({...formulario, nomeUsuario: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>E-mail</label>
                                <div className="input-icon">
                                    <Mail size={16} />
                                    <input type="email" value={formulario.email} onChange={(e) => setFormulario({...formulario, email: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group disabled">
                                <label>Função</label>
                                <div className="input-icon">
                                    <Shield size={16} />
                                    <input type="text" value={usuarioBanco?.funcao || ''} disabled />
                                    <Lock size={14} className="lock-icon" />
                                </div>
                                <small>Contate o administrador para alterar permissões.</small>
                            </div>
                            <div className="form-footer">
                                <button type="submit" className="btn-primary"><Save size={18} /> Salvar Alterações</button>
                            </div>
                        </form>
                    )}

                    {abaAtiva === 'seguranca' && (
                        <form onSubmit={handleAlterarSenha} className="fade-in">
                            <h3>Segurança da Conta</h3>
                            <p className="desc-text">Para sua segurança, informe a senha atual para definir uma nova.</p>

                            <div className="form-group">
                                <label>Senha Atual</label>
                                <div className="input-wrapper">
                                    <div className="input-icon" style={{width: '100%'}}>
                                        <Lock size={16} />
                                        <input
                                            type={verSenhaAtual ? "text" : "password"}
                                            value={dadosSenha.senhaAtual}
                                            onChange={(e) => setDadosSenha({...dadosSenha, senhaAtual: e.target.value})}
                                            placeholder="Digite sua senha atual"
                                            required
                                        />
                                    </div>
                                    <button type="button" className="btn-toggle-view" onClick={() => setVerSenhaAtual(!verSenhaAtual)}>
                                        {verSenhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <small style={{cursor: 'pointer', color: '#166534', fontWeight: '600'}} onClick={() => notify('Solicite ao administrador o seu código de redefinição.', 'info')}>
                                    Esqueceu a senha? Peça ajuda ao administrador.
                                </small>
                            </div>

                            <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0'}} />

                            <div className="form-group">
                                <label>Nova Senha</label>
                                <div className="input-wrapper">
                                    <div className="input-icon" style={{width: '100%'}}>
                                        <Key size={16} />
                                        <input
                                            type={verNovaSenha ? "text" : "password"}
                                            value={dadosSenha.novaSenha}
                                            onChange={(e) => setDadosSenha({...dadosSenha, novaSenha: e.target.value})}
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                    </div>
                                    <button type="button" className="btn-toggle-view" onClick={() => setVerNovaSenha(!verNovaSenha)}>
                                        {verNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="password-requirements" style={{marginTop: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px'}}>
                                    <RequisitoItem valido={requisitos.tamanho} texto="8+ caracteres" />
                                    <RequisitoItem valido={requisitos.maiuscula} texto="Letra maiúscula" />
                                    <RequisitoItem valido={requisitos.minuscula} texto="Letra minúscula" />
                                    <RequisitoItem valido={requisitos.numero} texto="Um número" />
                                    <RequisitoItem valido={requisitos.especial} texto="Caractere especial (@#$%)" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirmar Nova Senha</label>
                                <div className="input-icon">
                                    <Key size={16} />
                                    <input type="password" value={dadosSenha.confirmarSenha} onChange={(e) => setDadosSenha({...dadosSenha, confirmarSenha: e.target.value})} placeholder="Repita a nova senha" />
                                </div>
                            </div>

                            <div className="form-footer">
                                <button type="submit" className="btn-warning" disabled={!isSenhaValida || !dadosSenha.senhaAtual}>
                                    <Save size={18} /> Atualizar Senha
                                </button>
                            </div>
                        </form>
                    )}

                    {abaAtiva === 'preferencias' && (
                        <div className="fade-in center-content">
                            <h3>Notificações</h3>
                            <div className="empty-state">
                                <Bell size={48} color="#cbd5e1" />
                                <p>Configurações indisponíveis no momento.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Perfil;