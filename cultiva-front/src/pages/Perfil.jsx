import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Save, Key,
    Bell, Check, X, Eye, EyeOff, Lock, ChevronRight
} from 'lucide-react';
import { userService, authService } from '../services/api';
import { useNotify } from "../context/NotificationContext";
import '../css/Perfil.css';

const Perfil = () => {
    const notify = useNotify();
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('dados');
    const [verSenhaAtual, setVerSenhaAtual] = useState(false);
    const [verNovaSenha, setVerNovaSenha] = useState(false);
    const [usuarioBanco, setUsuarioBanco] = useState(null);

    const [formulario, setFormulario] = useState({
        nomeUsuario: '',
        email: ''
    });

    const [dadosSenha, setDadosSenha] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });

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
        if (sessao?.idUsuario) {
            carregarDadosDoServidor(sessao.idUsuario);
        } else {
            notify('Sessão expirada.', 'error');
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
            notify('Erro ao carregar perfil.', 'error');
        } finally {
            setCarregando(false);
        }
    };

    const handleSalvarDados = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nomeUsuario: formulario.nomeUsuario,
                email: formulario.email,
                funcao: usuarioBanco.funcao,
                ativo: usuarioBanco.ativo
            };

            await userService.atualizar(usuarioBanco.idUsuario, payload);

            const sessaoAtual = authService.obterUsuarioLogado();
            localStorage.setItem('usuarioLogado', JSON.stringify({ ...sessaoAtual, ...formulario }));

            notify('Perfil atualizado!', 'success');
        } catch (error) {
            notify('Erro ao salvar. Verifique se o e-mail já existe.', 'error');
        }
    };

    const handleAlterarSenha = async (e) => {
        e.preventDefault();
        if (dadosSenha.novaSenha !== dadosSenha.confirmarSenha) {
            notify('As senhas não conferem.', 'error');
            return;
        }
        try {
            await userService.atualizar(usuarioBanco.idUsuario, {
                senhaAtual: dadosSenha.senhaAtual,
                senha: dadosSenha.novaSenha
            });
            notify('Senha alterada com sucesso!', 'success');
            setDadosSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        } catch (error) {
            notify(error.response?.data?.message || 'Erro ao alterar senha.', 'error');
        }
    };

    const RequisitoItem = ({ valido, texto }) => (
        <div className="requisito-flex" style={{
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem',
            color: valido ? '#16a34a' : '#94a3b8', marginBottom: '6px'
        }}>
            {valido ? <Check size={14} strokeWidth={3} /> : <div style={{width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', marginLeft: 4}} />}
            <span style={{fontWeight: valido ? '600' : '400'}}>{texto}</span>
        </div>
    );

    if (carregando) return <div className="perfil-loading">Sincronizando dados...</div>;

    return (
        <div className="main-content animate-fade-in">
            <div className="perfil-header">
                <div className="header-content">
                    <div className="avatar-circle">
                        <User size={48} color="#16a34a" />
                    </div>
                    <div className="user-info-header">
                        <h2>{formulario.nomeUsuario}</h2>
                        <span className="role-badge">{usuarioBanco?.funcao}</span>
                    </div>
                </div>
            </div>

            <div className="perfil-grid">
                <div className="perfil-sidebar">
                    <button className={`menu-btn ${abaAtiva === 'dados' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('dados')}>
                        <User size={18} /> Dados Pessoais <ChevronRight size={14} style={{marginLeft:'auto'}}/>
                    </button>
                    <button className={`menu-btn ${abaAtiva === 'seguranca' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('seguranca')}>
                        <Lock size={18} /> Segurança <ChevronRight size={14} style={{marginLeft:'auto'}}/>
                    </button>
                    <button className={`menu-btn ${abaAtiva === 'preferencias' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('preferencias')}>
                        <Bell size={18} /> Preferências <ChevronRight size={14} style={{marginLeft:'auto'}}/>
                    </button>
                </div>

                <div className="perfil-content">
                    {abaAtiva === 'dados' && (
                        <form onSubmit={handleSalvarDados} className="animate-fade-in">
                            <h3>Informações Pessoais</h3>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <div className="input-icon">
                                    <User size={18} />
                                    <input type="text" value={formulario.nomeUsuario} onChange={(e) => setFormulario({...formulario, nomeUsuario: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>E-mail Institucional</label>
                                <div className="input-icon">
                                    <Mail size={18} />
                                    <input type="email" value={formulario.email} onChange={(e) => setFormulario({...formulario, email: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group disabled">
                                <label>Nível de Acesso</label>
                                <div className="input-icon">
                                    <Shield size={18} />
                                    <input type="text" value={usuarioBanco?.funcao} disabled />
                                    <Lock size={14} className="lock-icon" />
                                </div>
                                <small style={{color:'#94a3b8', display:'block', marginTop:'8px'}}>Privilégios de conta gerenciados pela empresa.</small>
                            </div>
                            <div className="form-footer">
                                <button type="submit" className="btn-primary"><Save size={18} /> Salvar Alterações</button>
                            </div>
                        </form>
                    )}

                    {abaAtiva === 'seguranca' && (
                        <form onSubmit={handleAlterarSenha} className="animate-fade-in">
                            <h3>Gestão de Senha</h3>
                            <p className="desc-text">Mantenha sua conta protegida com uma senha forte.</p>

                            <div className="form-group">
                                <label>Senha Atual</label>
                                <div className="input-wrapper">
                                    <div className="input-icon" style={{width: '100%'}}>
                                        <Lock size={18} />
                                        <input type={verSenhaAtual ? "text" : "password"} value={dadosSenha.senhaAtual} onChange={(e) => setDadosSenha({...dadosSenha, senhaAtual: e.target.value})} placeholder="Confirme sua senha atual" required />
                                    </div>
                                    <button type="button" className="btn-toggle-view" onClick={() => setVerSenhaAtual(!verSenhaAtual)}>
                                        {verSenhaAtual ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <hr style={{margin: '24px 0', border: 'none', borderTop: '1px solid #f1f5f9'}} />

                            <div className="form-group">
                                <label>Nova Senha</label>
                                <div className="input-wrapper">
                                    <div className="input-icon" style={{width: '100%'}}>
                                        <Key size={18} />
                                        <input type={verNovaSenha ? "text" : "password"} value={dadosSenha.novaSenha} onChange={(e) => setDadosSenha({...dadosSenha, novaSenha: e.target.value})} placeholder="Mínimo 8 dígitos" />
                                    </div>
                                    <button type="button" className="btn-toggle-view" onClick={() => setVerNovaSenha(!verNovaSenha)}>
                                        {verNovaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                <div className="password-requirements" style={{marginTop: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px'}}>
                                    <RequisitoItem valido={requisitos.tamanho} texto="8 ou mais caracteres" />
                                    <RequisitoItem valido={requisitos.maiuscula} texto="Pelo menos uma letra maiúscula" />
                                    <RequisitoItem valido={requisitos.minuscula} texto="Pelo menos uma letra minúscula" />
                                    <RequisitoItem valido={requisitos.numero} texto="Presença de números" />
                                    <RequisitoItem valido={requisitos.especial} texto="Caractere especial (@#$%)" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirmar Nova Senha</label>
                                <div className="input-icon">
                                    <Key size={18} />
                                    <input type="password" value={dadosSenha.confirmarSenha} onChange={(e) => setDadosSenha({...dadosSenha, confirmarSenha: e.target.value})} placeholder="Repita a senha" />
                                </div>
                            </div>

                            <div className="form-footer">
                                <button type="submit" className="btn-primary" disabled={!isSenhaValida || !dadosSenha.senhaAtual} style={{background: '#0f172a'}}>
                                    <Save size={18} /> Atualizar Segurança
                                </button>
                            </div>
                        </form>
                    )}

                    {abaAtiva === 'preferencias' && (
                        <div className="animate-fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                            <div style={{background:'#f1f5f9', width:'80px', height:'80px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                                <Bell size={32} color="#94a3b8" />
                            </div>
                            <h3>Em Breve</h3>
                            <p className="desc-text">Estamos preparando as configurações de notificações personalizadas para você.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Perfil;