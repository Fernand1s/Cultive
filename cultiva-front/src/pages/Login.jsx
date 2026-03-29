import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from "../services/api";
import { LogIn, Key, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";
import '../css/Login.css';
import CultiveLogo from '../assets/CultiveLogo.png';

export function Login() {
    const navigate = useNavigate();
    const notify = useNotify();

    const [loading, setLoading] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [codigo, setCodigo] = useState('');
    const [novaSenha, setNovaSenha] = useState('');

    // --- VALIDAÇÃO EM TEMPO REAL ---
    const temTamanho = novaSenha.length >= 8;
    const temMaiuscula = /[A-Z]/.test(novaSenha);
    const temMinuscula = /[a-z]/.test(novaSenha);
    const temNumero = /[0-9]/.test(novaSenha);
    const temEspecial = /[@#$%^&+=!]/.test(novaSenha);
    const isSenhaValida = temTamanho && temMaiuscula && temMinuscula && temNumero && temEspecial;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dadosDoBanco = await authService.login(email, senha);

            const idUsuario = dadosDoBanco.idUsuario || dadosDoBanco.id;

            await userService.registrarLog(
                "Login",
                `Usuário acessou o sistema via Web`,
                idUsuario
            );

            notify(`Bem-vindo, ${dadosDoBanco.nomeUsuario}!`, "success");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            notify(error.message || "E-mail ou senha incorretos.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResetSenha = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isSenhaValida) {
            notify("A senha não atende aos requisitos.", "error");
            setLoading(false);
            return;
        }

        try {
            await userService.redefinirSenha({
                email,
                codigo,
                novaSenha
            });

            notify("Senha alterada com sucesso!", "success");

            await userService.registrarLog(
                "Redefinição de Senha",
                `Sucesso para o e-mail: ${email}`,
                null
            );

            setTimeout(() => {
                setIsResetMode(false);
                setSenha('');
                setCodigo('');
                setNovaSenha('');
            }, 2000);
        } catch (error) {
            notify(error.message || "Erro ao redefinir. Verifique o código.", "error");
        } finally {
            setLoading(false);
        }
    };

    const RequisitoSenha = ({ valido, texto }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: valido ? '#16a34a' : '#94a3b8',
            marginBottom: '4px'
        }}>
            {valido ? <Check size={14} strokeWidth={3} /> : <div style={{width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', marginLeft: 4}} />}
            <span style={{ fontWeight: valido ? '600' : '400' }}>{texto}</span>
        </div>
    );

    return (
        <div className="login-container">

            <div className="login-content-wrapper">


                <div className="login-branding">
                    <img src={CultiveLogo} alt="Cultiva+ Logo" className="login-logo-img" />
                    <div className="branding-text">
                        <h2>Cultive+</h2>
                        {/*<p>Gestão Agrícola Inteligente</p>*/}
                    </div>
                </div>

                <div className="login-card">
                    <h1 className="login-title">
                        {isResetMode ? 'Nova Senha' : ''
                           // : 'Cultiva+'
                        }
                    </h1>
                    <p className="login-subtitle">
                        {isResetMode ? 'Defina sua nova senha de acesso.' : 'Acesse o painel de gestão agrícola.'}
                    </p>

                    <form className="login-form" onSubmit={isResetMode ? handleResetSenha : handleLogin}>

                        <div className="input-group">
                            <label className="input-label">E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input"
                                placeholder="exemplo@cultiva.com"
                                required
                            />
                        </div>

                        {!isResetMode ? (
                            <div className="input-group">
                                <label className="input-label">Senha</label>
                                <div className="input-wrapper">
                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        className="login-input"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-password"
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                    >
                                        {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Código de Autorização</label>
                                    <input
                                        type="text"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                        className="login-input input-code"
                                        placeholder="XXXXXX"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Nova Senha</label>
                                    <div className="input-wrapper">
                                        <input
                                            type={mostrarSenha ? "text" : "password"}
                                            value={novaSenha}
                                            onChange={(e) => setNovaSenha(e.target.value)}
                                            className="login-input"
                                            placeholder="Digite a nova senha"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn-toggle-password"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                        >
                                            {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    <div className="requisitos-container">
                                        <p className="requisitos-titulo">Segurança da Senha:</p>
                                        <RequisitoSenha valido={temTamanho} texto="Mínimo de 8 caracteres" />
                                        <RequisitoSenha valido={temMaiuscula} texto="Uma letra maiúscula" />
                                        <RequisitoSenha valido={temMinuscula} texto="Uma letra minúscula" />
                                        <RequisitoSenha valido={temNumero} texto="Pelo menos um número" />
                                        <RequisitoSenha valido={temEspecial} texto="Símbolo especial (@ # $ %)" />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="btn-login"
                            disabled={loading || (isResetMode && !isSenhaValida)}
                        >
                            {loading ? 'Validando...' : (
                                isResetMode ? (
                                    <><Key size={18} /> Redefinir Senha</>
                                ) : (
                                    <><LogIn size={18} /> Entrar no Sistema</>
                                )
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        {isResetMode ? (
                            <button
                                type="button"
                                className="link-action"
                                onClick={() => setIsResetMode(false)}
                            >
                                <ArrowLeft size={16} /> Voltar para o Login
                            </button>
                        ) : (
                            <>
                                <p className="footer-text">Problemas com acesso?</p>
                                <button
                                    type="button"
                                    className="link-action"
                                    onClick={() => setIsResetMode(true)}
                                >
                                    <Key size={16} /> Redefinir minha senha
                                </button>
                            </>
                        )}
                    </div>
                </div>


            </div>


        </div>
    );
}