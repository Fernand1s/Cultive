import { useState, useEffect, useMemo } from 'react';
import '../App.css';
import {
    LayoutDashboard, Sprout, Map as CloudSun,
    Activity, Bug, ClipboardList, PieChart as IconeGrafico,
    TrendingUp, Leaf, CheckCircle, AlertCircle,
    ChevronLeft, ChevronRight, Filter, Lightbulb, Sparkles, ArrowRight, X,
    ClipboardX, PackageOpen, CalendarOff, Ban,
    User, Clock, Calendar, CheckCircle2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';

// Importação do sistema de notificações
import { useNotify } from "../context/NotificationContext";

/**
 * Definições de Tipos (JSDoc)
 * @typedef {Object} Sugestao
 * @property {number} idArea
 * @property {number} idPlanta
 * @property {string} areaNome
 * @property {string} plantaNome
 * @property {string} tipoPlanta
 * @property {number} score
 * @property {string[]} motivos
 */

// --- COMPONENTES VISUAIS INTERNOS ---

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => {
    return (
        <div className="kpi-card">
            <div className="kpi-header">
                <span className="kpi-title">{title}</span>
                <div className={`icon-box ${colorClass}`}>
                    {Icon && <Icon size={20} />}
                </div>
            </div>
            <div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-subtext" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{subtext}</span>
                    {trend && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: trend === 'bad' ? '#ef4444' : '#16a34a', marginLeft: '8px' }}>
                            {trend === 'bad' ? '▼ Atenção' : '▲ Bom'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChartCard = ({ title, subtitle, icon: Icon, children, headerControls }) => {
    return (
        <div className="chart-card-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div className="chart-header">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className="chart-title">
                        {Icon && <Icon size={20} className="text-primary" />}
                        {title}
                    </h3>
                    {subtitle && <p className="chart-subtitle">{subtitle}</p>}
                </div>
                {headerControls && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {headerControls}
                    </div>
                )}
            </div>
            <div style={{ position: 'relative', width: '100%', height: '350px', minHeight: '300px' }}>
                {children}
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, message }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', width: '100%', color: '#94a3b8', textAlign: 'center', padding: '20px'
    }}>
        <div style={{
            background: '#f8fafc', padding: '20px', borderRadius: '50%', marginBottom: '16px',
            border: '2px dashed #cbd5e1'
        }}>
            {Icon && <Icon size={48} strokeWidth={1.5} color="#cbd5e1" />}
        </div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>{title}</h4>
        <p style={{ fontSize: '0.95rem', maxWidth: '300px', margin: 0 }}>{message}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 100
            }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px', color: '#1e293b' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color, fontSize: '0.85rem', margin: 0 }}>
                        {entry.name}:
                        <span style={{ fontWeight: 600, marginLeft: '4px' }}>
                            {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : entry.value}
                        </span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const criarDataLocal = (dataString) => {
    if (!dataString) return null;
    const dataPart = dataString.split('T')[0];
    const [ano, mes, dia] = dataPart.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
};

const Dashboard = () => {
    const notify = useNotify();
    const [activeTab, setActiveTab] = useState('geral');

    const [usuarioLogado] = useState(() => {
        try {
            const dados = localStorage.getItem('usuarioLogado');
            return dados ? JSON.parse(dados) : null;
        } catch (e) { return null; }
    });

    const [rawCultivos, setRawCultivos] = useState([]);
    const [rawPlantas, setRawPlantas] = useState([]);
    const [rawAreas, setRawAreas] = useState([]);
    const [rawTarefas, setRawTarefas] = useState([]);
    const [kpis, setKpis] = useState({ ativos: 0, saudaveis: 0, tarefasPendentes: 0, tarefasConcluidas: 0 });

    const [clima, setClima] = useState(null);
    const [idAreaClimaSelecionada, setIdAreaClimaSelecionada] = useState('');
    const [nomeAreaClima, setNomeAreaClima] = useState('');

    const [sugestoesInteligentes, setSugestoesInteligentes] = useState([]);
    const [indiceSugestao, setIndiceSugestao] = useState(0);

    const [modalPlantioAberto, setModalPlantioAberto] = useState(false);
    const [dadosPlantioRapido, setDadosPlantioRapido] = useState({
        quantidadePlantada: '',
        dataPlantio: new Date().toISOString().split('T')[0]
    });

    const [filtroTipo, setFiltroTipo] = useState('geral');
    const [filtroId, setFiltroId] = useState('');
    const [dataReferencia, setDataReferencia] = useState(new Date());

    const [filtroTarefaInicio, setFiltroTarefaInicio] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [filtroTarefaFim, setFiltroTarefaFim] = useState(new Date().toISOString().split('T')[0]);
    const [filtroResponsavel, setFiltroResponsavel] = useState('TODOS');

    const [graficoTipos, setGraficoTipos] = useState([]);
    const [graficoSaude, setGraficoSaude] = useState([]);
    const [filtroPontualidade, setFiltroPontualidade] = useState('PENDENTES');

    const COLORS = { green: '#16a34a', orange: '#f59e0b', blue: '#0ea5e9', red: '#ef4444', purple: '#8b5cf6', gray: '#94a3b8', darkRed: '#991b1b', yellow: '#eab308', orangeLight: '#fff7ed' };
    const PIE_COLORS = [COLORS.green, COLORS.orange, COLORS.blue, COLORS.purple];

    const tabs = [
        { id: 'geral', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
        { id: 'catalogo', label: 'Catálogo', icon: <Leaf size={18} /> },
        { id: 'saude', label: 'Saúde', icon: <Activity size={18} /> },
        { id: 'tarefas', label: 'Tarefas', icon: <ClipboardList size={18} /> },
        { id: 'producao', label: 'Produção', icon: <TrendingUp size={18} /> },
    ];

    const gerarSugestoesInteligentes = (areas, plantas, cultivos) => {
        const sugestoesCalculadas = [];
        const mapaLuz = { 'PLENO_SOL': ['ALTA'], 'MEIA_SOMBRA': ['MEDIA', 'BAIXA'], 'SOMBRA': ['BAIXA'] };

        const areasOcupadasIds = cultivos
            .filter(c => c.statusCultivo === 'ATIVO' && c.areaCultivo)
            .map(c => c.areaCultivo.idArea);

        const areasLivres = areas.filter(a => !areasOcupadasIds.includes(a.idArea));

        areasLivres.forEach(area => {
            let melhorPlanta = null;
            let maiorScore = -1;
            let motivosMelhor = [];

            plantas.forEach(planta => {
                let score = 0;
                let motivos = [];

                if (planta.solosRecomendados && planta.solosRecomendados.includes(area.tipoSolo)) {
                    score += 50;
                    motivos.push(`Solo ideal (${area.tipoSolo})`);
                }

                const luzArea = area.quantidadeLuz || 'PLENO_SOL';
                const luzNecessaria = planta.necessidadeLuz || 'ALTA';
                const compativeis = mapaLuz[luzArea] || [];
                if (compativeis.includes(luzNecessaria)) {
                    score += 30;
                    motivos.push(`Luz perfeita (${luzArea})`);
                }

                if (planta.cicloMedioDias && planta.cicloMedioDias < 90) score += 10;

                if (score > maiorScore) {
                    maiorScore = score;
                    melhorPlanta = planta;
                    motivosMelhor = motivos;
                }
            });

            if (melhorPlanta && maiorScore > 0) {
                sugestoesInteligentes.push({
                    idArea: area.idArea,
                    idPlanta: melhorPlanta.idPlanta,
                    areaNome: area.nomeArea,
                    plantaNome: melhorPlanta.nomePopular,
                    tipoPlanta: melhorPlanta.tipoPlanta,
                    score: maiorScore,
                    motivos: motivosMelhor
                });
            }
        });

        return sugestoesCalculadas.sort((a, b) => b.score - a.score);
    };

    const carregarDadosGerais = async () => {
        try {
            let urlTarefas = 'http://localhost:8090/api/tarefas';
            if (usuarioLogado) {
                urlTarefas += `?idUsuario=${usuarioLogado.idUsuario}&funcao=${usuarioLogado.funcao}`;
            }

            const [areasRes, plantasRes, cultivosRes, tarefasRes] = await Promise.all([
                fetch('http://localhost:8090/api/areas').catch(() => ({ ok: false })),
                fetch('http://localhost:8090/api/plantas').catch(() => ({ ok: false })),
                fetch('http://localhost:8090/api/cultivos').catch(() => ({ ok: false })),
                fetch(urlTarefas).catch(() => ({ ok: false }))
            ]);

            const areas = areasRes.ok ? await areasRes.json() : [];
            const plantas = plantasRes.ok ? await plantasRes.json() : [];
            const cultivos = cultivosRes.ok ? await cultivosRes.json() : [];
            const tarefas = tarefasRes.ok ? await tarefasRes.json() : [];

            setRawAreas(areas);
            setRawPlantas(plantas);
            setRawCultivos(cultivos);
            setRawTarefas(tarefas);

            const sugestoesGeradas = gerarSugestoesInteligentes(areas, plantas, cultivos);
            setSugestoesInteligentes(sugestoesGeradas);

            if (areas.length > 0 && !idAreaClimaSelecionada) setIdAreaClimaSelecionada(areas[0].idArea);

            const ativos = cultivos.filter(c => c.statusCultivo === 'ATIVO');
            const saudaveis = ativos.filter(c => c.estadoPlanta === 'SAUDAVEL').length;

            const pendentes = tarefas.filter(t => !t.concluida && !t.cancelada).length;
            const concluidas = tarefas.filter(t => t.concluida).length;

            setKpis({ ativos: ativos.length, saudaveis, tarefasPendentes: pendentes, tarefasConcluidas: concluidas });

            const tiposCount = {};
            plantas.forEach(p => { const t = p.tipoPlanta || 'OUTROS'; tiposCount[t] = (tiposCount[t] || 0) + 1; });
            const tiposArray = Object.keys(tiposCount).map(key => ({ name: key, value: tiposCount[key] }));
            setGraficoTipos(tiposArray);

            const saudeCount = { 'SAUDAVEL': 0, 'EM_ATENCAO': 0, 'COM_PRAGA': 0, 'CRITICO': 0 };
            ativos.forEach(c => { if (saudeCount[c.estadoPlanta] !== undefined) saudeCount[c.estadoPlanta]++; });
            setGraficoSaude([
                { name: 'Saudável', valor: saudeCount['SAUDAVEL'], fill: COLORS.green },
                { name: 'Atenção', valor: saudeCount['EM_ATENCAO'], fill: COLORS.orange },
                { name: 'Praga', valor: saudeCount['COM_PRAGA'], fill: '#ef5350' },
                { name: 'Crítico', valor: saudeCount['CRITICO'], fill: COLORS.red }
            ]);

        } catch (error) {
            notify("Erro ao sincronizar dados da dashboard", "error");
        }
    };

    useEffect(() => { carregarDadosGerais(); }, []);

    useEffect(() => {
        if (!idAreaClimaSelecionada || rawAreas.length === 0) return;
        const carregarDadosAreaEspecifica = async () => {
            const areaAtual = rawAreas.find(a => a.idArea == idAreaClimaSelecionada);
            if (!areaAtual) return;
            setNomeAreaClima(areaAtual.nomeArea);
            try {
                const climaRes = await fetch(`http://localhost:8090/api/areas/${areaAtual.idArea}/clima`);
                if (climaRes.ok) setClima(await climaRes.json());
                else setClima(null);
            } catch (err) { setClima(null); }
        };
        void carregarDadosAreaEspecifica();
    }, [idAreaClimaSelecionada, rawAreas]);

    const usuariosParaFiltro = useMemo(() => {
        const mapUsuarios = new Map();
        rawTarefas.forEach(t => {
            if (t.responsavel) {
                mapUsuarios.set(t.responsavel.idUsuario, t.responsavel.nomeUsuario);
            }
        });
        return Array.from(mapUsuarios.entries()).map(([id, nome]) => ({ id, nome }));
    }, [rawTarefas]);

    const dadosTarefasAnaliticos = useMemo(() => {
        if (!rawTarefas.length) return null;

        const converterParaInteiro = (valor) => {
            if (!valor) return 0;
            let dataStr = '';
            if (valor instanceof Date) {
                const ano = valor.getFullYear();
                const mes = String(valor.getMonth() + 1).padStart(2, '0');
                const dia = String(valor.getDate()).padStart(2, '0');
                return parseInt(`${ano}${mes}${dia}`, 10);
            }
            if (typeof valor === 'string') {
                dataStr = valor.split('T')[0];
            }
            const numeroLimpo = dataStr.replace(/-/g, '');
            return parseInt(numeroLimpo, 10) || 0;
        };

        const inicioInt = converterParaInteiro(filtroTarefaInicio);
        const fimInt = converterParaInteiro(filtroTarefaFim);
        const hojeInt = converterParaInteiro(new Date());

        const tarefasFiltradas = rawTarefas.filter(t => {
            const dataRefInt = t.dataPrazo ? converterParaInteiro(t.dataPrazo) : converterParaInteiro(t.dataCriacao);
            const dentroDoPrazo = dataRefInt >= inicioInt && dataRefInt <= fimInt;
            const matchResponsavel = filtroResponsavel === 'TODOS' || (t.responsavel && String(t.responsavel.idUsuario) === String(filtroResponsavel));
            return dentroDoPrazo && matchResponsavel;
        });

        let pendentes = 0;
        let concluidas = 0;
        let canceladas = 0;
        let pendentesNoPrazo = 0;
        let pendentesAtrasadas = 0;
        let concluidasNoPrazo = 0;
        let concluidasComAtraso = 0;

        const timelineMap = {};

        tarefasFiltradas.forEach(t => {
            const prazoInt = converterParaInteiro(t.dataPrazo);
            const conclusaoInt = t.dataConclusao ? converterParaInteiro(t.dataConclusao) : 0;
            const dataVisual = t.dataPrazo ? new Date(t.dataPrazo) : new Date();
            const diaKey = dataVisual.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            if (!timelineMap[diaKey]) {
                timelineMap[diaKey] = { nome: diaKey, pendentes: 0, concluidas: 0, sortDate: prazoInt };
            }

            if (t.cancelada) {
                canceladas++;
            }
            else if (t.concluida) {
                concluidas++;
                timelineMap[diaKey].concluidas++;
                if (prazoInt > 0 && conclusaoInt > prazoInt) concluidasComAtraso++;
                else concluidasNoPrazo++;
            }
            else {
                pendentes++;
                timelineMap[diaKey].pendentes++;
                if (prazoInt > 0 && prazoInt < hojeInt) pendentesAtrasadas++;
                else pendentesNoPrazo++;
            }
        });

        const graficoStatus = [
            { name: 'Concluídas', value: concluidas, fill: COLORS.green },
            { name: 'Pendentes', value: pendentes, fill: COLORS.yellow },
            { name: 'Canceladas', value: canceladas, fill: COLORS.gray }
        ].filter(d => d.value > 0);

        const graficoPontualidadePendentes = [
            { name: 'No Prazo', value: pendentesNoPrazo, fill: COLORS.blue },
            { name: 'Atrasadas', value: pendentesAtrasadas, fill: COLORS.red }
        ].filter(d => d.value > 0);

        const graficoPontualidadeConcluidas = [
            { name: 'No Prazo', value: concluidasNoPrazo, fill: COLORS.green },
            { name: 'Com Atraso', value: concluidasComAtraso, fill: COLORS.orange }
        ].filter(d => d.value > 0);

        const graficoTimeline = Object.values(timelineMap)
            .sort((a, b) => a.sortDate - b.sortDate)
            .map(({ nome, pendentes, concluidas }) => ({ nome, pendentes, concluidas }));

        return {
            metricas: {
                total: tarefasFiltradas.length,
                pendentes, concluidas, canceladas,
                atrasadas: pendentesAtrasadas,
                concluidasComAtraso,
                concluidasNoPrazo
            },
            graficoStatus,
            graficoPontualidadePendentes,
            graficoPontualidadeConcluidas,
            graficoTimeline
        };

    }, [rawTarefas, filtroTarefaInicio, filtroTarefaFim, filtroResponsavel]);

    const abrirModalPlantio = () => {
        setDadosPlantioRapido({
            quantidadePlantada: '',
            dataPlantio: new Date().toISOString().split('T')[0]
        });
        setModalPlantioAberto(true);
    };

    const confirmarPlantioRapido = (e) => {
        e.preventDefault();
        const sugestaoAtual = sugestoesInteligentes[indiceSugestao];
        if(!sugestaoAtual) return;

        const payload = {
            areaCultivo: { idArea: sugestaoAtual.idArea },
            plantaCultivada: { idPlanta: sugestaoAtual.idPlanta },
            quantidadePlantada: Number(dadosPlantioRapido.quantidadePlantada),
            dataPlantio: dadosPlantioRapido.dataPlantio,
            statusCultivo: 'ATIVO',
            estadoPlanta: 'SAUDAVEL'
        };

        fetch('http://localhost:8090/api/cultivos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if(res.ok) {
                    notify('Cultivo iniciado com sucesso! 🌱', 'success');
                    setModalPlantioAberto(false);
                    carregarDadosGerais();
                    setIndiceSugestao(0);
                } else {
                    notify('Erro ao iniciar cultivo.', 'error');
                }
            })
            .catch(() => notify('Falha na comunicação com o servidor.', 'error'));
    };

    const alterarMes = (direcao) => {
        const novaData = new Date(dataReferencia);
        novaData.setMonth(novaData.getMonth() + (direcao === 'proximo' ? 1 : -1));
        setDataReferencia(novaData);
    };

    const dadosProducaoFiltrados = useMemo(() => {
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const historicoMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - i, 1);
            historicoMap.set(`${mesesNomes[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`, { plantado: 0, colhido: 0 });
        }
        const cultivosFiltrados = rawCultivos.filter(c => {
            if (filtroTipo === 'geral') return true;
            if (filtroTipo === 'planta' && filtroId) return c.plantaCultivada && c.plantaCultivada.idPlanta.toString() === filtroId.toString();
            if (filtroTipo === 'area' && filtroId) return c.areaCultivo && c.areaCultivo.idArea.toString() === filtroId.toString();
            return true;
        });
        cultivosFiltrados.forEach(c => {
            if (c.statusCultivo === 'COLHIDO' && c.dataColheitaFinal) {
                const d = criarDataLocal(c.dataColheitaFinal);
                if (d) {
                    const k = `${mesesNomes[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
                    if (historicoMap.has(k)) historicoMap.get(k).colhido += (Number(c.quantidadeColhida) || 0);
                }
            }
            if (c.dataPlantio) {
                const d = criarDataLocal(c.dataPlantio);
                if (d) {
                    const k = `${mesesNomes[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
                    if (historicoMap.has(k)) historicoMap.get(k).plantado += (Number(c.quantidadePlantada) || 0);
                }
            }
        });
        return Array.from(historicoMap, ([label, vals]) => ({ name: label, ...vals }));
    }, [rawCultivos, filtroTipo, filtroId, dataReferencia]);

    const temDadosProducao = dadosProducaoFiltrados.some(d => d.plantado > 0 || d.colhido > 0);

    const dadosVisaoGeral = useMemo(() => {
        const hoje = new Date();
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const mapa = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            mapa.set(mesesNomes[d.getMonth()], { plantado: 0, colhido: 0 });
        }
        rawCultivos.forEach(c => {
            if (c.statusCultivo === 'COLHIDO' && c.dataColheitaFinal) {
                const d = criarDataLocal(c.dataColheitaFinal);
                if (d) { const m = mesesNomes[d.getMonth()]; if (mapa.has(m)) mapa.get(m).colhido += (Number(c.quantidadeColhida) || 0); }
            }
            if (c.dataPlantio) {
                const d = criarDataLocal(c.dataPlantio);
                if (d) { const m = mesesNomes[d.getMonth()]; if (mapa.has(m)) mapa.get(m).plantado += (Number(c.quantidadePlantada) || 0); }
            }
        });
        return Array.from(mapa, ([name, vals]) => ({ name, ...vals }));
    }, [rawCultivos]);

    const proximaSugestao = () => setIndiceSugestao((prev) => (prev + 1) % sugestoesInteligentes.length);
    const anteriorSugestao = () => setIndiceSugestao((prev) => (prev - 1 + sugestoesInteligentes.length) % sugestoesInteligentes.length);

    return (
        <div className="animate-fade-in" style={{ padding: '0 10px', maxWidth: '100%', overflowX: 'hidden' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Dashboard</h1>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Visão geral e inteligência de dados do Cultiva+.</p>
            </div>

            {activeTab === 'geral' && sugestoesInteligentes.length > 0 && (
                <div className="modern-banner ai-banner" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', position: 'relative', marginBottom: '24px' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0.1 }}>
                        <Sparkles size={100} color="#16a34a" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', zIndex: 1, flexWrap: 'wrap' }}>
                        <div className="icon-box bg-green-light" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                            <Lightbulb size={32} className="text-green-600" />
                        </div>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Sugestão Inteligente <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>Match {(sugestoesInteligentes[indiceSugestao].score)}%</span>
                                </h3>
                                {sugestoesInteligentes.length > 1 && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={anteriorSugestao} className="btn-icon-sm" style={{ background: 'white', borderRadius: '50%' }}><ChevronLeft size={16} /></button>
                                        <button onClick={proximaSugestao} className="btn-icon-sm" style={{ background: 'white', borderRadius: '50%' }}><ChevronRight size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <p style={{ color: '#166534', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>
                                A área <strong>{sugestoesInteligentes[indiceSugestao].areaNome}</strong> está livre.
                                Recomendamos plantar <strong>{sugestoesInteligentes[indiceSugestao].plantaNome}</strong>.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {sugestoesInteligentes[indiceSugestao].motivos.map((motivo, idx) => (
                                    <span key={idx} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.6)', color: '#14532d', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle size={12} /> {motivo}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button className="btn-primary" onClick={abrirModalPlantio} style={{ padding: '10px 20px', fontSize: '0.9rem', boxShadow: '0 4px 6px -2px rgba(22, 163, 74, 0.2)' }}>
                            Plantar Agora <ArrowRight size={16} style={{ marginLeft: 6 }} />
                        </button>
                    </div>
                </div>
            )}

            <div className="kpi-grid">
                <StatCard title="Cultivos Ativos" value={kpis.ativos} subtext="Monitoramento em tempo real" icon={Sprout} colorClass="bg-green-light" />
                <StatCard title="Plantas Saudáveis" value={kpis.saudaveis} subtext={`${kpis.ativos > 0 ? Math.round((kpis.saudaveis / kpis.ativos) * 100) : 0}% do total ativo`} icon={CheckCircle} colorClass="bg-blue-light" />
                <StatCard title="Tarefas Pendentes" value={kpis.tarefasPendentes} subtext="Exclui canceladas" icon={AlertCircle} colorClass="bg-red-light" />
                <StatCard title="Tarefas Concluídas" value={kpis.tarefasConcluidas} subtext="Histórico total" icon={ClipboardList} colorClass="bg-purple-light" />
            </div>

            <div className="tabs-container">
                {tabs.map(tab => (
                    <div key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </div>
                ))}
            </div>

            <div className="tab-content" style={{ paddingBottom: '40px' }}>
                {activeTab === 'geral' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        <ChartCard title="Tendência de Produção" subtitle="Visão macro (últimos 6 meses)" icon={TrendingUp}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadosVisaoGeral} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorColhido" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip content={CustomTooltip} />
                                    <Area type="monotone" dataKey="colhido" stroke={COLORS.green} strokeWidth={3} fillOpacity={1} fill="url(#colorColhido)" name="colhido" />
                                    <Area type="monotone" dataKey="plantado" stroke={COLORS.blue} strokeWidth={2} strokeDasharray="5 5" fill="none" name="plantado" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Clima Local" subtitle={`Monitoramento em tempo real`} icon={CloudSun}
                                   headerControls={
                                       <select value={idAreaClimaSelecionada} onChange={(e) => setIdAreaClimaSelecionada(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}>
                                           {rawAreas.length === 0 && <option value="">Sem áreas</option>}
                                           {rawAreas.map(area => <option key={area.idArea} value={area.idArea}>{area.nomeArea}</option>)}
                                       </select>
                                   }>
                            {clima ? (
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '30px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b' }}>{clima.incidenciaSolarMedia?.toFixed(2)}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Incidência Solar (kWh/m²)</div>
                                        </div>
                                        <div style={{ width: '1px', height: '60px', backgroundColor: '#e2e8f0' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0ea5e9' }}>{clima.umidadeMedia?.toFixed(1)}%</div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Umidade do Ar</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>{rawAreas.length > 0 ? "Carregando dados..." : "Cadastre uma área."}</div>
                            )}
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'catalogo' && (
                    <div style={{ width: '100%' }}>
                        <ChartCard title="Distribuição do Catálogo" subtitle="Tipos de plantas cadastradas" icon={IconeGrafico}>
                            {graficoTipos.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={graficoTipos} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                            {graficoTipos.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />)}
                                        </Pie>
                                        <Tooltip content={CustomTooltip} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState icon={PackageOpen} title="Catálogo Vazio" message="Cadastre plantas." />
                            )}
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'saude' && (
                    <div style={{ width: '100%' }}>
                        <ChartCard title="Saúde dos Cultivos" subtitle="Monitoramento de pragas e doenças" icon={Bug}>
                            {kpis.ativos > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={graficoSaude} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                        <Tooltip content={CustomTooltip} cursor={{ fill: '#f1f5f9' }} />
                                        <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={60}>
                                            {graficoSaude.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState icon={Leaf} title="Sem Cultivos" message="Inicie um plantio." />
                            )}
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'tarefas' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#64748b', fontWeight:600, fontSize: '0.9rem'}}><Filter size={16} /> Filtros:</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                                <input type="date" value={filtroTarefaInicio} onChange={e => setFiltroTarefaInicio(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', fontSize: '0.85rem' }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>até</span>
                                <input type="date" value={filtroTarefaFim} onChange={e => setFiltroTarefaFim(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} color="#64748b" />
                                <select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                                    <option value="TODOS">Todos os Usuários</option>
                                    {usuariosParaFiltro && usuariosParaFiltro.map(u => ( <option key={u.id} value={u.id}>{u.nome}</option> ))}
                                </select>
                            </div>
                        </div>

                        {dadosTarefasAnaliticos && (
                            <div className="kpi-grid">
                                <StatCard title="Total no Período" value={dadosTarefasAnaliticos.metricas.total} subtext="Tarefas filtradas" icon={ClipboardList} colorClass="bg-blue-light" />
                                <StatCard title="Pendentes Atrasadas" value={dadosTarefasAnaliticos.metricas.atrasadas} subtext="Atenção Necessária" icon={AlertCircle} colorClass="bg-red-light" />
                                <StatCard title="Concluídas c/ Atraso" value={dadosTarefasAnaliticos.metricas.concluidasComAtraso} subtext="Entregues fora do prazo" icon={CheckCircle} colorClass="bg-orange-light" />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                            <ChartCard title="Status das Tarefas" subtitle="Visão geral" icon={PieChart}>
                                {dadosTarefasAnaliticos && dadosTarefasAnaliticos.graficoStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={dadosTarefasAnaliticos.graficoStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                                                {dadosTarefasAnaliticos.graficoStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip content={CustomTooltip} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState icon={ClipboardX} title="Sem Dados" message="Nenhuma tarefa." />}
                            </ChartCard>

                            <ChartCard title="Pontualidade" icon={Clock} headerControls={
                                <div style={{display:'flex', background:'#f1f5f9', borderRadius:'6px', padding:'2px', gap:'2px'}}>
                                    <button onClick={() => setFiltroPontualidade('PENDENTES')} style={{ padding:'4px 12px', borderRadius:'4px', border:'none', fontSize:'0.75rem', background: filtroPontualidade === 'PENDENTES' ? 'white' : 'transparent' }}>Pendentes</button>
                                    <button onClick={() => setFiltroPontualidade('CONCLUIDAS')} style={{ padding:'4px 12px', borderRadius:'4px', border:'none', fontSize:'0.75rem', background: filtroPontualidade === 'CONCLUIDAS' ? 'white' : 'transparent' }}>Concluídas</button>
                                </div>
                            }>
                                {dadosTarefasAnaliticos && ((filtroPontualidade === 'PENDENTES' && dadosTarefasAnaliticos.graficoPontualidadePendentes.length > 0) || (filtroPontualidade === 'CONCLUIDAS' && dadosTarefasAnaliticos.graficoPontualidadeConcluidas.length > 0)) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={filtroPontualidade === 'PENDENTES' ? dadosTarefasAnaliticos.graficoPontualidadePendentes : dadosTarefasAnaliticos.graficoPontualidadeConcluidas} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                                                {(filtroPontualidade === 'PENDENTES' ? dadosTarefasAnaliticos.graficoPontualidadePendentes : dadosTarefasAnaliticos.graficoPontualidadeConcluidas).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip content={CustomTooltip} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState icon={Clock} title="Sem Dados" message="Não há tarefas." />}
                            </ChartCard>
                        </div>
                    </div>
                )}

                {activeTab === 'producao' && (
                    <div style={{ width: '100%' }}>
                        <ChartCard title="Análise de Produção Detalhada" icon={TrendingUp}
                                   headerControls={
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                           <button onClick={() => alterarMes('anterior')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px' }}><ChevronLeft size={16} /></button>
                                           <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setFiltroId(''); }} style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                               <option value="geral">Geral</option>
                                               <option value="planta">Planta</option>
                                               <option value="area">Área</option>
                                           </select>
                                           {filtroTipo !== 'geral' && (
                                               <select value={filtroId} onChange={(e) => setFiltroId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                   <option value="">...</option>
                                                   {filtroTipo === 'planta' ? rawPlantas.map(p => <option key={p.idPlanta} value={p.idPlanta}>{p.nomePopular}</option>) : rawAreas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                                               </select>
                                           )}
                                           <button onClick={() => alterarMes('proximo')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px' }}><ChevronRight size={16} /></button>
                                       </div>
                                   }>
                            {temDadosProducao ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dadosProducaoFiltrados}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip content={CustomTooltip} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line name="colhido" type="monotone" dataKey="colhido" stroke={COLORS.green} strokeWidth={3} />
                                        <Line name="plantado" type="monotone" dataKey="plantado" stroke={COLORS.blue} strokeWidth={2} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <EmptyState icon={CalendarOff} title="Sem Produção" message="Sem registros." />}
                        </ChartCard>
                    </div>
                )}
            </div>

            {modalPlantioAberto && sugestoesInteligentes[indiceSugestao] && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content animate-scale-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0 }}>
                                <Sprout className="text-primary" size={24} /> Confirmar Plantio
                            </h2>
                            <button onClick={() => setModalPlantioAberto(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                            <p style={{ margin: 0, color: '#166534' }}>
                                Plantando <strong>{sugestoesInteligentes[indiceSugestao]?.plantaNome}</strong> em <strong>{sugestoesInteligentes[indiceSugestao]?.areaNome}</strong>.
                            </p>
                        </div>
                        <form onSubmit={confirmarPlantioRapido}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="form-label">Quantidade</label>
                                <input type="number" required min="1" className="form-input" value={dadosPlantioRapido.quantidadePlantada} onChange={e => setDadosPlantioRapido({ ...dadosPlantioRapido, quantidadePlantada: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="form-label">Data</label>
                                <input type="date" required className="form-input" value={dadosPlantioRapido.dataPlantio} onChange={e => setDadosPlantioRapido({ ...dadosPlantioRapido, dataPlantio: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button type="button" className="btn-outline" onClick={() => setModalPlantioAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;