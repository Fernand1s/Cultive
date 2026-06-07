
import { use, useState } from 'react';
import '../App.css';
import '../css/Suporte.css';
import {
    Plus, Calendar, Trash2, User,
    CheckCircle2, Edit2, Ban, StickyNote, ClipboardList, X, Clock
} from 'lucide-react';


const Suporte = () => {

    return (
        <div className="main-content animate-fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="dashboard-title">Suporte</h1>
                    <p className="dashboard-subtitle">Central de ajuda e suporte ao usuário</p>
                </div>
                
            </div>
        </div>
    );
};

export default Suporte;