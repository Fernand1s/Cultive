import { useState, useEffect } from 'react';
import '../App.css';
import '../css/Relatorios.css'
import {
    BarChart3, MapPin, Sprout, Droplets, Bug,
    Calendar, AlertCircle, TrendingUp, Download,
    Filter, RefreshCw, Layers
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useNotify } from "../context/NotificationContext";

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ title, value, subtext, icon: IconComponent, colorClass, trend }) => (
    <div className="kpi-card animate-fade-in">
        <div className="kpi-header">
            <span className="kpi-title">{title}</span>
            <div className={`icon-box ${colorClass}`}>
                {IconComponent && <IconComponent size={20} />}
            </div>
        </div>
        <div>
            <div className="kpi-value">{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {trend && <span style={{ color: trend > 0 ? '#16a34a' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>}
                <div className="kpi-subtext">{subtext}</div>
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip-custom">
                <p className="tooltip-label">{label}</p>
                <p className="tooltip-value">{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

// --- COMPONENTE PRINCIPAL ---
const Relatorios = () => {
    const notify = useNotify();

    // Estados de Dados
    const [areas, setAreas] = useState([]);
    const [abaAtiva, setAbaAtiva] = useState('geral'); // 'geral' ou 'detalhado'
    const [loading, setLoading] = useState(false);

    // Seleção
    const [areaSelecionadaId, setAreaSelecionadaId] = useState('');
    const [cultivosDaArea, setCultivosDaArea] = useState([]);
    const [cultivoSelecionado, setCultivoSelecionado] = useState(null);

    // Dados Analíticos
    const [totalAgua, setTotalAgua] = useState(null);
    const [historicoPragas, setHistoricoPragas] = useState([]);
    const [graficoStatusArea, setGraficoStatusArea] = useState([]);

    const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    const carregarDadosIniciais = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8090/api/areas');
            if (!response.ok) throw new Error();
            const data = await response.json();

            setAreas(data);
            const dadosGrafico = data.map(a => ({
                name: a.nomeArea,
                quantidade: a.cultivos ? a.cultivos.length : 0
            }));
            setGraficoStatusArea(dadosGrafico);
        } catch (err) {
            notify("Não foi possível carregar os dados das áreas.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarArea = (idArea) => {
        setAreaSelecionadaId(idArea);
        const area = areas.find(a => a.idArea === parseInt(idArea));
        if (area) {
            setCultivosDaArea(area.cultivos || []);
            setCultivoSelecionado(null);
            setTotalAgua(null);
            setHistoricoPragas([]);
        } else {
            setCultivosDaArea([]);
        }
    };

    const analisarCultivo = async (cultivo) => {
        setLoading(true);
        setCultivoSelecionado(cultivo);

        try {
            // Busca paralela para performance
            const [resAgua, resPragas] = await Promise.all([
                fetch(`http://localhost:8090/api/relatorios/agua/${cultivo.idCultivo}`),
                fetch(`http://localhost:8090/api/relatorios/pragas/${cultivo.idCultivo}`)
            ]);

            const agua = await resAgua.json();
            const pragas = await resPragas.json();

            setTotalAgua(agua);
            setHistoricoPragas(pragas);

            notify(`Análise de ${cultivo.planta?.nomePopular} carregada.`, "success");
        } catch (err) {
            notify("Erro ao buscar detalhes do cultivo.", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportarRelatorio = () => {
        notify("Preparando PDF para exportação...", "info");
        // Lógica de exportação futura aqui
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0 10px' }}>

            {/* Header Profissional */}
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Relatórios e Inteligência</h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Dados consolidados para tomada de decisão.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-outline" onClick={carregarDadosIniciais} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-primary" onClick={exportarRelatorio}>
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            {/* Tabs de Navegação */}
            <div className="tabs-container" style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    className={`tab-btn ${abaAtiva === 'geral' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('geral')}
                >
                    <BarChart3 size={18} /> Visão Geral da Fazenda
                </button>
                <button
                    className={`tab-btn ${abaAtiva === 'detalhado' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('detalhado')}
                >
                    <Filter size={18} /> Filtro Detalhado por Cultivo
                </button>
            </div>

            {/* --- CONTEÚDO: ABA GERAL --- */}
            {abaAtiva === 'geral' && (
                <div className="animate-fade-in">
                    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                        <StatCard title="Áreas Ativas" value={areas.length} subtext="Setores mapeados" icon={MapPin} colorClass="bg-green-light" />
                        <StatCard title="Cultivos Totais" value={graficoStatusArea.reduce((acc, curr) => acc + curr.quantidade, 0)} subtext="Em andamento" icon={Sprout} colorClass="bg-blue-light" />
                        <StatCard title="Eficiência" value="94%" subtext="+2% que o mês anterior" icon={TrendingUp} colorClass="bg-orange-light" trend={2} />
                    </div>

                    <div className="chart-card-container" style={{ padding: '24px' }}>
                        <div className="chart-header">
                            <h3 className="chart-title"><Layers size={20} className="text-primary"/> Distribuição de Cultivos por Setor</h3>
                            <p className="chart-subtitle">Análise volumétrica de plantio por área geográfica.</p>
                        </div>
                        <div style={{ height: '350px', marginTop: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graficoStatusArea}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                    <Bar dataKey="quantidade" name="Cultivos" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTEÚDO: ABA DETALHADO --- */}
            {abaAtiva === 'detalhado' && (
                <div className="report-detailed-grid animate-fade-in">
                    <div className="sidebar-filters">
                        <div className="filter-card" style={{ height: 'fit-content' }}>
                            <label className="input-label"><MapPin size={14} /> Selecionar Área</label>
                            <select
                                value={areaSelecionadaId}
                                onChange={(e) => handleSelecionarArea(e.target.value)}
                                className="form-select"
                                style={{ marginBottom: '20px' }}
                            >
                                <option value="">Escolha um setor...</option>
                                {areas.map(area => (
                                    <option key={area.idArea} value={area.idArea}>{area.nomeArea}</option>
                                ))}
                            </select>

                            <label className="input-label"><Sprout size={14} /> Cultivo Ativo</label>
                            <div className="cultivo-list-scroll">
                                {cultivosDaArea.length > 0 ? (
                                    cultivosDaArea.map(cultivo => (
                                        <div
                                            key={cultivo.idCultivo}
                                            className={`cultivo-item-card ${cultivoSelecionado?.idCultivo === cultivo.idCultivo ? 'active' : ''}`}
                                            onClick={() => analisarCultivo(cultivo)}
                                        >
                                            <div className="cultivo-item-info">
                                                <strong>{cultivo.planta?.nomePopular}</strong>
                                                <span>Plantado em: {new Date(cultivo.dataPlantio).toLocaleDateString()}</span>
                                            </div>
                                            <AlertCircle size={16} color={cultivo.estadoPlanta === 'SAUDAVEL' ? '#16a34a' : '#ef4444'} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-substate">Aguardando seleção...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="main-report-area">
                        {!cultivoSelecionado ? (
                            <div className="empty-state-box" style={{ height: '100%', background: 'white', borderRadius: '12px' }}>
                                <Filter size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                <h3>Análise Detalhada</h3>
                                <p>Selecione uma área e um cultivo para ver métricas específicas.</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="kpi-grid" style={{ marginBottom: 0 }}>
                                    <StatCard title="Irrigação Acumulada" value={`${totalAgua || 0} L`} subtext="Volume total" icon={Droplets} colorClass="bg-blue-light" />
                                    <StatCard title="Status Fitossanitário" value={cultivoSelecionado.estadoPlanta} subtext="Último registro" icon={Bug} colorClass={cultivoSelecionado.estadoPlanta === 'SAUDAVEL' ? 'bg-green-light' : 'bg-red-light'} />
                                </div>

                                <div className="chart-card-container">
                                    <div className="chart-header">
                                        <h3 className="chart-title" style={{ color: '#ef4444' }}><Bug size={20} /> Histórico de Incidências</h3>
                                        <p className="chart-subtitle">Eventos de pragas e doenças registrados.</p>
                                    </div>

                                    {historicoPragas.length === 0 ? (
                                        <div className="empty-state-box" style={{ padding: '40px' }}>
                                            <AlertCircle size={40} color="#16a34a" style={{ opacity: 0.5 }} />
                                            <p style={{ marginTop: '10px' }}>Nenhum problema detectado até o momento.</p>
                                        </div>
                                    ) : (
                                        <div className="pest-timeline" style={{ padding: '10px 20px 20px' }}>
                                            {historicoPragas.map(praga => (
                                                <div key={praga.idEvento} className="pest-item-modern">
                                                    <div className="pest-date-badge">
                                                        <Calendar size={14} />
                                                        {new Date(praga.dataHora).toLocaleDateString()}
                                                    </div>
                                                    <div className="pest-details">
                                                        <h4>{praga.nomePragaOuDoenca}</h4>
                                                        <p>{praga.observacaoEvento || "Sem observações adicionais."}</p>
                                                        <span className={`level-tag level-${praga.nivelAfetacao}`}>Nível {praga.nivelAfetacao}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Relatorios;