
import { use, useState } from 'react';
import '../App.css';
import '../css/Estoque.css';
import {
    Plus, Calendar, Trash2, User,
    CheckCircle2, Edit2, Ban, StickyNote, ClipboardList, X, Clock
} from 'lucide-react';


const Estoque = () => {

    const [ modalAberto, setModalAberto] = useState(false);

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Centro de Estoque</h1>
                    <p className="dashboard-subtitle">Lance aqui os itens do estoque da fazenda.</p>
                </div>
                <button className="botao-ver" onClick={() => {}}>
                    <Plus size={20} /> Novo Item
                </button>
            </div>

            <div className="task-list-container">

            </div>

            {/* MODAL CRIAR/EDITAR Estoque*/}

            {modalAberto && (

                <div className="modal-modern-overlay-tarefa">
                    <div className="modal-modern-content-tarefa">
                        <div className="modal-header-premium-tarefa">
                            <h2>{modoEdicao ? 'Ajustar Detalhes' : 'Nova Atribuição'}</h2>
                        
                            <button className="btn-close-modal" onClick={() => setModalAberto(false)}><X size={20} /></button>
                        

                        </div>
                        <form onSubmit={salvarTarefa} className="form-premium-tarefa">

                            <div className="form-group-tarefa">
                                <label className="input-label">Nome</label>
                                <input className="login-input" placeholder="Nome do item" value={novaTarefa.titulo} onChange={e => setNovaTarefa({...novaTarefa, titulo: e.target.value})} required />
                            </div>

                            <div className="form-group-tarefa">
                                <label className="input-label">categoria</label>
                                <input className="login-input" placeholder="Categoria do item" value={novaTarefa.categoria} onChange={e => setNovaTarefa({...novaTarefa, categoria: e.target.value})} required />
                            </div>












                            <div className="form-group-tarefa">
                                <label className="input-label">Instruções Adicionais</label>
                                <textarea className="login-input" style={{minHeight:'80px'}} placeholder="Descreva os detalhes..." value={novaTarefa.descricao} onChange={e => setNovaTarefa({...novaTarefa, descricao: e.target.value})} />
                            </div>
                            <div className="form-row-tarefa" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                <div className="form-group-tarefa">
                                    <label className="input-label">Urgência</label>
                                    <select className="login-input" value={novaTarefa.prioridade} onChange={e => setNovaTarefa({...novaTarefa, prioridade: e.target.value})}>
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div className="form-group-tarefa">
                                    <label className="input-label">Data Limite</label>
                                    <input type="date" className="login-input" value={novaTarefa.dataPrazo} onChange={e => setNovaTarefa({...novaTarefa, dataPrazo: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group-tarefa">
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
                            <div className="modal-footer-tarefa" style={{borderTop:'1px solid #f1f5f9', paddingTop:'20px', marginTop:'20px'}}>
                                <button type="button" onClick={() => setModalAberto(false)} className="link-action-tarefa" style={{color:'#64748b'}}>Descartar</button>
                                <button type="submit" className="btn-login-tarefa" style={{marginTop:0, padding:'10px 30px'}} disabled={carregando}>{carregando ? "Sincronizando..." : "Confirmar Tarefa"}</button>
                            </div>

                            
                        </form>
                    </div>
                </div>

            )}




            {/* MODAL OBSERVAÇÃO */}

        </div>
    );
};

export default Estoque;