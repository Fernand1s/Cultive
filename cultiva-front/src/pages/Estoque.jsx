
import '../App.css';
import '../css/Estoque.css';
import {
    Plus, Calendar, Trash2, User,
    CheckCircle2, Edit2, Ban, StickyNote, ClipboardList, X, Clock
} from 'lucide-react';


const Estoque = () => {


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

            {/* MODAL CRIAR/EDITAR */}




            {/* MODAL OBSERVAÇÃO */}

        </div>
    );
};

export default Estoque;