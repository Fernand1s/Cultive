import { useState, useEffect, useMemo, useCallback } from 'react';
import '../App.css';
import '../css/Dashboard.css';
import { useNotify } from "../context/NotificationContext";
import {
    LayoutDashboard, Sprout, Map as CloudSun, Activity, Bug, ClipboardList,
    PieChart as IconeGrafico, TrendingUp, Leaf, ChevronLeft, ChevronRight,
    Sparkles, ArrowRight, X, ClipboardX, PackageOpen, CalendarOff, User,
    Clock, CheckCircle2, RefreshCw, Gauge, Plus, Lightbulb
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {cultivoService, tarefaService, plantaService, areaService, authService, userService} from '../services/api';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
    <div className={`kpi-card animate-slide-up`}>
        <div className="kpi-header">
            <span className="kpi-title">{title}</span>
            <div className={`icon-box ${colorClass}`}>
                {Icon && <Icon size={20} />}
            </div>
        </div>
        <div className="kpi-body">
            <div className="kpi-value">{value}</div>
            <div className="kpi-subtext">
                <span>{subtext}</span>
                {trend && (
                    <span className={`trend-tag ${trend === 'bad' ? 'trend-down' : 'trend-up'}`}>
                        {trend === 'bad' ? '▼ Atenção' : '▲ Estável'}
                    </span>
                )}
            </div>
        </div>
    </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, children, headerControls }) => (
    <div className="chart-card-container">
        <div className="chart-header">
            <div className="title-group">
                <h3 className="chart-title">
                    {Icon && <Icon size={20} className="icon-primary" />}
                    {title}
                </h3>
                {subtitle && <p className="chart-subtitle">{subtitle}</p>}
            </div>
            {headerControls && <div className="controls-group">{headerControls}</div>}
        </div>
        <div className="chart-content">
            {children}
        </div>
    </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
    <div className="empty-state-container">
        <div className="empty-state-icon-box">
            {Icon && <Icon size={48} />}
        </div>
        <h4>{title}</h4>
        <p>{message}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip-dashboard">
                <p className="tooltip-label">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="tooltip-value" style={{ color: entry.color }}>
                        {entry.name}: <strong>{entry.value.toLocaleString('pt-BR')}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const COLORS = { green: '#16a34a', orange: '#f59e0b', blue: '#0ea5e9', red: '#ef4444', purple: '#8b5cf6', gray: '#94a3b8', yellow: '#eab308' };
const PIE_COLORS = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple];

// --- COMPONENTE PRINCIPAL ---

const Dashboard = () => {
    const notify = useNotify();
    const [activeTab, setActiveTab] = useState('geral');
    const [loading, setLoading] = useState(false);
    const [loadingClima, setLoadingClima] = useState(false);

    // Estados de Dados
    const [rawCultivos, setRawCultivos] = useState([]);
    const [rawPlantas, setRawPlantas] = useState([]);
    const [rawAreas, setRawAreas] = useState([]);
    const [rawTarefas, setRawTarefas] = useState([]);
    const [kpis, setKpis] = useState({ ativos: 0, saudaveis: 0, tarefasPendentes: 0, tarefasConcluidas: 0 });

    // Inteligência e Filtros
    const [clima, setClima] = useState(null);
    const [idAreaClimaSelecionada, setIdAreaClimaSelecionada] = useState('');
    const [sugestoesInteligentes, setSugestoesInteligentes] = useState([]);
    const [indiceSugestao, setIndiceSugestao] = useState(0);
    const [modalPlantioAberto, setModalPlantioAberto] = useState(false);
    const [dadosPlantioRapido, setDadosPlantioRapido] = useState({ quantidadePlantada: '', dataPlantio: new Date().toISOString().split('T')[0] });

    const [filtroTarefaInicio, setFiltroTarefaInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    });
    const [filtroTarefaFim, setFiltroTarefaFim] = useState(new Date().toISOString().split('T')[0]);
    const [filtroResponsavel, setFiltroResponsavel] = useState('TODOS');
    const [filtroPontualidade, setFiltroPontualidade] = useState('PENDENTES');

    // Produção
    const [dataReferencia, setDataReferencia] = useState(new Date());
    const [filtroTipo, setFiltroTipo] = useState('geral');
    const [filtroId, setFiltroId] = useState('');


    const tabs = [
        { id: 'geral', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
        { id: 'catalogo', label: 'Catálogo', icon: <Leaf size={18} /> },
        { id: 'saude', label: 'Saúde', icon: <Activity size={18} /> },
        { id: 'tarefas', label: 'Tarefas', icon: <ClipboardList size={18} /> },
        { id: 'producao', label: 'Produção', icon: <TrendingUp size={18} /> },
    ];

    // --- CARREGAMENTO DE DADOS COMPLETO E CORRIGIDO ---
    const carregarDadosGerais = useCallback(async () => {
        setLoading(true);
        try {
            const [areas, plantasBrutas, cultivos, tarefas] = await Promise.all([
                areaService.listar(),
                plantaService.listar(),
                cultivoService.listar(),
                tarefaService.listar()
            ]);

            const plantas = plantasBrutas.map(p => ({
                ...p,
                solosRecomendados: Array.isArray(p.solosRecomendados)
                    ? p.solosRecomendados.map(s => s.toString().trim().toUpperCase())
                    : []
            }));

            const idsAreasOcupadas = new Set(
                cultivos
                    .filter(c => c.statusCultivo === 'ATIVO')
                    .map(c => c.areaCultivo?.idArea)
            );

            const areasLivres = areas.filter(a => !idsAreasOcupadas.has(a.idArea));

            // MOTOR DE INTELIGÊNCIA (Sugestões de Plantio)
            const novasSugestoes = [];

            for (const area of areasLivres) {
                const soloDaArea = area.tipoSolo?.toString().trim().toUpperCase();
                if (!soloDaArea) continue;

                let dadosClima = { incidenciaSolarMedia: 5.5 };
                try {
                    const climaData = await areaService.obterClima(area.idArea);
                    if (climaData) dadosClima = climaData;
                } catch (e) {
                    console.warn(`Aviso: Clima não disponível para área ${area.nomeArea}`);
                }

                plantas.forEach(planta => {
                    const aceitaSolo = planta.solosRecomendados.includes(soloDaArea);

                    if (aceitaSolo) {
                        let scoreCalculado = 75;

                        // Match de Luz
                        if (area.quantidadeLuz === planta.luzRecomendada) {
                            scoreCalculado += 15;
                        }

                        // Match de Clima NASA
                        if (planta.luzRecomendada === 'PLENO_SOL' && dadosClima.incidenciaSolarMedia > 5.5) {
                            scoreCalculado += 10;
                        } else if (planta.luzRecomendada === 'SOMBRA' && dadosClima.incidenciaSolarMedia < 4.0) {
                            scoreCalculado += 10;
                        }

                        novasSugestoes.push({
                            idArea: area.idArea,
                            areaNome: area.nomeArea,
                            idPlanta: planta.idPlanta,
                            plantaNome: planta.nomePopular,
                            score: Math.min(scoreCalculado, 100),
                            motivos: [
                                `Solo ${soloDaArea} ideal para esta espécie`,
                                area.quantidadeLuz === planta.luzRecomendada ? "Exposição solar perfeita" : "Luz compatível",
                                dadosClima.incidenciaSolarMedia > 5 ? "Alta taxa de fotossíntese local" : "Clima favorável"
                            ]
                        });
                    }
                });
            }

            // ATUALIZAÇÃO DOS ESTADOS
            setRawAreas(areas);
            setRawPlantas(plantas);
            setRawCultivos(cultivos);
            setRawTarefas(tarefas);
            setSugestoesInteligentes(novasSugestoes.sort((a, b) => b.score - a.score));
            setIndiceSugestao(0);

            // CÁLCULO DE KPIs
            const ativos = cultivos.filter(c => c.statusCultivo === 'ATIVO');
            setKpis({
                ativos: ativos.length,
                saudaveis: ativos.filter(c => c.estadoPlanta === 'SAUDAVEL').length,
                tarefasPendentes: tarefas.filter(t => !t.concluida && !t.cancelada).length,
                tarefasConcluidas: tarefas.filter(t => t.concluida).length
            });

            if (areas.length > 0) {
                setIdAreaClimaSelecionada(prev => prev || areas[0].idArea);
            }

        } catch (error) {
            console.error("Erro crítico no Dashboard:", error.message);
            notify(error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => { carregarDadosGerais(); }, [carregarDadosGerais]);

    // --- CLIMA ---
    useEffect(() => {
        if (!idAreaClimaSelecionada) return;

        const buscarClima = async () => {
            setLoadingClima(true);
            try {
                const data = await areaService.obterClima(idAreaClimaSelecionada);
                setClima(data);
            } catch (error) {
                console.error(`Erro ao buscar clima para área ${idAreaClimaSelecionada}:`, error);
                setClima(null);
            } finally {
                setLoadingClima(false);
            }
        };

        buscarClima();
    }, [idAreaClimaSelecionada]);

    // --- MEMORIZAÇÃO DE DADOS PARA GRÁFICOS ---
    const graficoSaude = useMemo(() => {
        const counts = { SAUDAVEL: 0, ATENCAO: 0, CRITICO: 0 };
        const ativos = rawCultivos.filter(c => c.statusCultivo === 'ATIVO');

        ativos.forEach(c => {
            const estado = (c.estadoPlanta || '').toUpperCase();

            if (estado === 'SAUDAVEL') {
                counts.SAUDAVEL++;
            } else if (estado === 'ATENCAO') {
                counts.ATENCAO++;
            } else if (estado === 'PRAGA' || estado === 'CRITICO') {
                counts.CRITICO++;
            }
        });

        return [
            { name: 'Saudável', valor: counts.SAUDAVEL, fill: COLORS.green },
            { name: 'Atenção', valor: counts.ATENCAO, fill: COLORS.orange },
            { name: 'Crítico', valor: counts.CRITICO, fill: COLORS.red }
        ];
    }, [rawCultivos]);

    const dadosTarefasAnaliticos = useMemo(() => {
        const inicio = new Date(filtroTarefaInicio).getTime();
        const fim = new Date(filtroTarefaFim).getTime();
        const hoje = new Date().getTime();

        const filtradas = rawTarefas.filter(t => {
            const dataRef = new Date(t.dataPrazo || t.dataCriacao).getTime();
            const matchResp = filtroResponsavel === 'TODOS' || String(t.responsavel?.idUsuario) === filtroResponsavel;
            return dataRef >= inicio && dataRef <= fim && matchResp;
        });

        const status = { concluidas: 0, pendentes: 0, canceladas: 0, atrasadas: 0, concluidasAtraso: 0 };
        filtradas.forEach(t => {
            if (t.cancelada) status.canceladas++;
            else if (t.concluida) {
                status.concluidas++;
                if (t.dataConclusao && new Date(t.dataConclusao) > new Date(t.dataPrazo)) status.concluidasAtraso++;
            } else {
                status.pendentes++;
                if (t.dataPrazo && new Date(t.dataPrazo).getTime() < hoje) status.atrasadas++;
            }
        });

        return {
            metricas: { total: filtradas.length, atrasadas: status.atrasadas, concluidasAtraso: status.concluidasAtraso },
            graficoStatus: [
                { name: 'Concluídas', value: status.concluidas, fill: COLORS.green },
                { name: 'Pendentes', value: status.pendentes, fill: COLORS.yellow },
                { name: 'Canceladas', value: status.canceladas, fill: COLORS.gray }
            ].filter(v => v.value > 0),
            graficoPontualidadePendentes: [
                { name: 'No Prazo', value: status.pendentes - status.atrasadas, fill: COLORS.blue },
                { name: 'Atrasadas', value: status.atrasadas, fill: COLORS.red }
            ],
            graficoPontualidadeConcluidas: [
                { name: 'No Prazo', value: status.concluidas - status.concluidasAtraso, fill: COLORS.green },
                { name: 'Com Atraso', value: status.concluidasAtraso, fill: COLORS.orange }
            ]
        };
    }, [rawTarefas, filtroTarefaInicio, filtroTarefaFim, filtroResponsavel]);

    const dadosProducaoFiltrados = useMemo(() => {
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        const dataGrafico = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(dataReferencia);
            d.setMonth(d.getMonth() - (5 - i));
            return {
                name: mesesNomes[d.getMonth()],
                mesIndex: d.getMonth(),
                ano: d.getFullYear(),
                plantado: 0,
                colhido: 0
            };
        });

        rawCultivos.forEach(c => {
            // Filtros de busca
            if (filtroTipo === 'planta' && String(c.plantaCultivada?.idPlanta) !== filtroId) return;
            if (filtroTipo === 'area' && String(c.areaCultivo?.idArea) !== filtroId) return;

            // Processa Plantio
            const dataP = new Date(c.dataPlantio);
            const itemP = dataGrafico.find(d => d.mesIndex === dataP.getMonth() && d.ano === dataP.getFullYear());
            if (itemP) itemP.plantado += (c.quantidadePlantada || 0);

            // Processa Colheita
            if (c.statusCultivo === 'COLHIDO' && c.dataColheitaFinal) {
                const dataC = new Date(c.dataColheitaFinal);
                const itemC = dataGrafico.find(d => d.mesIndex === dataC.getMonth() && d.ano === dataC.getFullYear());
                if (itemC) itemC.colhido += (c.quantidadeColhida || 0);
            }
        });
        return dataGrafico;
    }, [rawCultivos, filtroTipo, filtroId, dataReferencia]);

    // --- FUNÇÕES DE AÇÃO ---
    const confirmarPlantioRapido = async (e) => {
        e.preventDefault();
        if (loading) return;

        const sug = sugestoesInteligentes[indiceSugestao];
        const usuarioLogado = authService.obterUsuarioLogado();
        const idUsuario = usuarioLogado?.idUsuario || usuarioLogado?.id;

        if (!dadosPlantioRapido.quantidadePlantada || dadosPlantioRapido.quantidadePlantada <= 0) {
            notify("Informe uma quantidade válida para o plantio.", "error");
            return;
        }

        setLoading(true);

        const payload = {
            idArea: sug.idArea,
            idPlanta: sug.idPlanta,
            quantidadePlantada: parseFloat(dadosPlantioRapido.quantidadePlantada),
            dataPlantio: dadosPlantioRapido.dataPlantio,
            statusCultivo: 'ATIVO',
            estadoPlanta: 'SAUDAVEL',
            observacaoCultivo: "Plantio sugerido pela Inteligência de Dados"
        };

        try {
            const res = await cultivoService.criar(payload);

            await userService.registrarLog(
                "Plantio Inteligente",
                `Sistema sugeriu e usuário confirmou plantio de ${sug.plantaNome} na ${sug.areaNome}`,
                idUsuario
            );

            notify(`Sucesso! ${sug.plantaNome} plantado na área ${sug.areaNome}.`, "success");

            setModalPlantioAberto(false);
            setDadosPlantioRapido({
                quantidadePlantada: '',
                dataPlantio: new Date().toISOString().split('T')[0]
            });

            await carregarDadosGerais();

        } catch (error) {
            console.error("Erro ao processar plantio rápido:", error);
            notify(error.message || "Erro ao processar plantio.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-wrapper animate-fade-in">
            {/**
            <header className="dashboard-header">
                
                <div>
                    <h1>Dashboard Analytics</h1>
                    <p>Inteligência de dados para sua safra</p>
                </div>
                <button className={`btn-sync ${loading ? 'spinning' : ''}`} onClick={carregarDadosGerais}>
                    <RefreshCw size={18} /> {loading ? 'Sincronizando...' : 'Sincronizar Dados'}
                </button>
                
            </header>
            */}

            {/* Banner AI */}
            {/** 
            {activeTab === 'geral' && sugestoesInteligentes.length > 0 && (
                <div className="ai-suggestion-banner">
                    {sugestoesInteligentes.length > 1 && (
                        <button className="nav-arrow left" onClick={() => setIndiceSugestao(p => (p - 1 + sugestoesInteligentes.length) % sugestoesInteligentes.length)}>
                            <ChevronLeft size={24}/>
                        </button>
                    )}

                    <div className="ai-content-layout">
                        <div className="ai-icon-wrapper"><Sparkles size={32} /></div>
                        <div className="ai-text-content">
                            <h3>Oportunidade: {sugestoesInteligentes[indiceSugestao].plantaNome}</h3>
                            <p>A área <strong>{sugestoesInteligentes[indiceSugestao].areaNome}</strong> é ideal agora.</p>
                            <div className="ai-tags">
                                {sugestoesInteligentes[indiceSugestao].motivos.map((m, i) => (
                                    <span key={i} className="ai-tag"><CheckCircle2 size={12} /> {m}</span>
                                ))}
                            </div>
                        </div>
                        <div className="ai-action">
                            <div className="ai-score-badge"><Gauge size={16} /> {sugestoesInteligentes[indiceSugestao].score}% Match</div>
                            <button className="btn-primary" onClick={() => setModalPlantioAberto(true)}>Plantar <ArrowRight size={18} /></button>
                        </div>
                    </div>

                    {sugestoesInteligentes.length > 1 && (
                        <button className="nav-arrow right" onClick={() => setIndiceSugestao(p => (p + 1) % sugestoesInteligentes.length)}>
                            <ChevronRight size={24}/>
                        </button>
                    )}
                </div>
            )}*/}

            <div className="kpi-grid">
                <StatCard title="Cultivos Ativos" value={kpis.ativos} subtext="Lotes em campo" icon={Sprout} colorClass="bg-green-light" />
                <StatCard title="Sanidade Global" value={`${kpis.ativos > 0 ? Math.round((kpis.saudaveis/kpis.ativos)*100) : 0}%`} subtext="Plantas saudáveis" icon={Activity} colorClass="bg-blue-light" trend={kpis.saudaveis < kpis.ativos ? 'bad' : 'good'} />
                <StatCard title="Pendências" value={kpis.tarefasPendentes} subtext="Tarefas para hoje" icon={ClipboardList} colorClass="bg-orange-light" />
                <StatCard title="Áreas Disponíveis" value={rawAreas.length - kpis.ativos > 0 ? rawAreas.length - kpis.ativos : 0} subtext="Capacidade ociosa" icon={CloudSun} colorClass="bg-purple-light" />
                {/*<StatCard title="Áreas Disponíveis" value={rawAreas.length - kpis.ativos} subtext="Capacidade ociosa" icon={CloudSun} colorClass="bg-purple-light" />*/}
            </div>

            <nav className="tabs-container">
                <div className="tabs-group">
                    {tabs.map(tab => (
                    <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </button>
                    ))}
                </div>
                
                <div className="sync-button-wrapper">
                    <button className={`btn-sync ${loading ? 'spinning' : ''}`} onClick={carregarDadosGerais}>
                        <RefreshCw size={18} /> {loading ? 'Sincronizando...' : 'Sincronizar Dados'}
                    </button>
                </div>
            </nav>

            <main className="tab-content">
                {activeTab === 'geral' && (
                    <div className="charts-main-grid">
                        {/* Lado Esquerdo: Balanço de Safra */}
                        <ChartCard
                            title="Balanço de Safra"
                            subtitle="Plantio vs Colheita (Últimos 6 meses)"
                            icon={TrendingUp}
                        >
                            {dadosProducaoFiltrados.some(d => d.plantado > 0 || d.colhido > 0) ? (
                                <div className="chart-wrapper-fixed">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dadosProducaoFiltrados}>
                                            <defs>
                                                <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="plantado" stroke="#0ea5e9" fill="url(#colorP)" name="Plantado" />
                                            <Area type="monotone" dataKey="colhido" stroke="#16a34a" fill="url(#colorC)" name="Colhido" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyState icon={TrendingUp} title="Sem histórico" message="Não há registros de plantio ou colheita para este período." />
                            )}
                        </ChartCard>

                        {/* Lado Direito: Clima */}
                        <ChartCard
                            title="Clima do Setor"
                            subtitle="Sensores em tempo real"
                            icon={CloudSun}
                            headerControls={
                                <select className="select-modern" value={idAreaClimaSelecionada} onChange={e => setIdAreaClimaSelecionada(e.target.value)}>
                                    {rawAreas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                                </select>
                            }
                        >
                            {loadingClima ? (
                                <div className="loading-state">Atualizando sensores...</div>
                            ) : clima ? (
                                <div className="clima-container-premium">
                                    <div className="clima-item">
                                        <span className="clima-label">Radiação Solar</span>
                                        <div className="clima-value-box">
                                            <span className="value solar">{clima.incidenciaSolarMedia?.toFixed(1)}</span>
                                            <span className="unit">kWh/m²</span>
                                        </div>
                                    </div>
                                    <div className="clima-divider-horizontal"></div>
                                    <div className="clima-item">
                                        <span className="clima-label">Umidade Média</span>
                                        <div className="clima-value-box">
                                            <span className="value humidity">{clima.umidadeMedia?.toFixed(1)}%</span>
                                            <span className="unit">Umidade</span>
                                        </div>
                                    </div>
                                </div>
                            ) : <EmptyState icon={CloudSun} title="Sem conexão" message="Não foi possível obter dados dos sensores desta área." />}
                        </ChartCard>
                    </div>
                )}

                {activeTab === 'catalogo' && (
                    <ChartCard title="Diversidade de Plantio" subtitle="Composição do catálogo" icon={IconeGrafico}>
                        {rawPlantas.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie data={rawPlantas.reduce((acc, p) => {
                                        const t = p.tipoPlanta || 'Outros';
                                        const exist = acc.find(x => x.name === t);
                                        if(exist) exist.value++; else acc.push({name: t, value: 1});
                                        return acc;
                                    }, [])} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                        {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState icon={Leaf} title="Catálogo Vazio" message="Cadastre novas espécies de plantas para visualizar a diversidade." />
                        )}
                    </ChartCard>
                )}

                {activeTab === 'saude' && (
                    <ChartCard title="Monitoramento Fitossanitário" subtitle="Estado de saúde dos lotes" icon={Bug}>
                        {rawCultivos.filter(c => c.statusCultivo === 'ATIVO').length > 0 ? (
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={graficoSaude} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}/>
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false}/>
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={55}>
                                            {graficoSaude.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState icon={Activity} title="Nenhum cultivo ativo" message="Não há plantas em campo para monitorar a saúde no momento."/>
                        )}
                    </ChartCard>
                )}

                {activeTab === 'tarefas' && (
                    <div className="tarefas-container animate-fade-in">
                        <div className="filter-bar">
                            <div className="filter-group">
                                <CalendarOff size={18} className="icon-primary" />
                                <span>Período:</span>
                                <input type="date" value={filtroTarefaInicio} onChange={e => setFiltroTarefaInicio(e.target.value)} />
                                <span>até</span>
                                <input type="date" value={filtroTarefaFim} onChange={e => setFiltroTarefaFim(e.target.value)} />
                            </div>
                            <div className="filter-group">
                                <User size={18} className="icon-primary" />
                                <select className="select-modern" value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)}>
                                    <option value="TODOS">Todos Colaboradores</option>
                                    {[...new Map(
                                        rawTarefas
                                            .filter(t => t.responsavel?.idUsuario)
                                            .map(t => [t.responsavel.idUsuario, t.responsavel.nomeUsuario])
                                    ).entries()].map(([id, nome]) => (
                                        <option key={id} value={String(id)}>{nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="charts-main-grid">
                            <ChartCard title="Status de Operações" icon={IconeGrafico}>
                                {dadosTarefasAnaliticos.graficoStatus.length > 0 ? (
                                    <div className="chart-wrapper-fixed">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={dadosTarefasAnaliticos.graficoStatus} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                    {dadosTarefasAnaliticos.graficoStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={ClipboardX} title="Sem tarefas" message="Nenhuma tarefa encontrada para os filtros selecionados." />
                                )}
                            </ChartCard>

                            <ChartCard title="Análise de Pontualidade" icon={Clock} headerControls={
                                <div className="toggle-group">
                                    <button className={filtroPontualidade === 'PENDENTES' ? 'active' : ''} onClick={() => setFiltroPontualidade('PENDENTES')}>Pendentes</button>
                                    <button className={filtroPontualidade === 'CONCLUIDAS' ? 'active' : ''} onClick={() => setFiltroPontualidade('CONCLUIDAS')}>Concluídas</button>
                                </div>
                            }>
                                { (filtroPontualidade === 'PENDENTES' ? dadosTarefasAnaliticos.graficoPontualidadePendentes : dadosTarefasAnaliticos.graficoPontualidadeConcluidas).some(d => d.value > 0) ? (
                                    <div className="chart-wrapper-fixed">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={filtroPontualidade === 'PENDENTES' ? dadosTarefasAnaliticos.graficoPontualidadePendentes : dadosTarefasAnaliticos.graficoPontualidadeConcluidas}
                                                    outerRadius={100}
                                                    dataKey="value"
                                                    label
                                                >
                                                    {(filtroPontualidade === 'PENDENTES' ? dadosTarefasAnaliticos.graficoPontualidadePendentes : dadosTarefasAnaliticos.graficoPontualidadeConcluidas).map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={Clock} title="Sem dados de prazo" message={`Não há tarefas ${filtroPontualidade.toLowerCase()} para analisar.`} />
                                )}
                            </ChartCard>
                        </div>
                    </div>
                )}

                {activeTab === 'producao' && (
                    <ChartCard
                        title="Histórico de Produtividade"
                        icon={TrendingUp}
                        headerControls={
                            <div className="filter-row-container">
                                <div className="month-navigator">
                                    <button className="btn-icon-nav" onClick={() => {
                                        const d = new Date(dataReferencia);
                                        d.setMonth(d.getMonth() - 1);
                                        setDataReferencia(d);
                                    }}>
                                        <ChevronLeft size={18}/>
                                    </button>
                                    <span className="date-indicator">
                            {dataReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                                    <button className="btn-icon-nav" onClick={() => {
                                        const d = new Date(dataReferencia);
                                        d.setMonth(d.getMonth() + 1);
                                        setDataReferencia(d);
                                    }}>
                                        <ChevronRight size={18}/>
                                    </button>
                                </div>
                                <div className="select-group">
                                    <select className="select-modern" value={filtroTipo} onChange={e => {setFiltroTipo(e.target.value); setFiltroId('');}}>
                                        <option value="geral">Visão Geral</option>
                                        <option value="planta">Por Planta</option>
                                        <option value="area">Por Área</option>
                                    </select>
                                    {filtroTipo !== 'geral' && (
                                        <select className="select-modern animate-fade-in" value={filtroId} onChange={e => setFiltroId(e.target.value)}>
                                            <option value="">Selecionar {filtroTipo === 'planta' ? 'Planta' : 'Área'}...</option>
                                            {filtroTipo === 'planta'
                                                ? rawPlantas.map(p => <option key={p.idPlanta} value={p.idPlanta}>{p.nomePopular}</option>)
                                                : rawAreas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)
                                            }
                                        </select>
                                    )}
                                </div>
                            </div>
                        }
                    >
                        {dadosProducaoFiltrados.some(d => d.plantado > 0 || d.colhido > 0) ? (
                            <div className="chart-wrapper-fixed">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dadosProducaoFiltrados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="plantado" stroke="#0ea5e9" fill="url(#colorP)" name="Plantado" strokeWidth={2} />
                                        <Area type="monotone" dataKey="colhido" stroke="#16a34a" fill="none" name="Colhido" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState icon={PackageOpen} title="Produção zerada" message="Não há dados de colheita para os critérios selecionados." />
                        )}
                    </ChartCard>
                )}
            </main>

            {modalPlantioAberto && (
                <div className="modal-modern-overlay">
                    <div className="modal-modern-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header-flex">
                            <h2 className="modal-title">
                                <div className="icon-box bg-green-light" style={{ display: 'inline-flex', marginRight: '12px' }}>
                                    <Sprout size={20} />
                                </div>
                                Confirmar Plantio
                            </h2>
                            <button className="btn-close-modal" onClick={() => setModalPlantioAberto(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ai-suggestion-mini-banner">
                            <div className="mini-banner-icon"> <Lightbulb size={20} color="#eab308" /></div>
                            <div className="mini-banner-text">
                                Iniciando <strong>{sugestoesInteligentes[indiceSugestao].plantaNome}</strong> <br/>
                                no setor <strong>{sugestoesInteligentes[indiceSugestao].areaNome}</strong>
                            </div>
                        </div>

                        <form onSubmit={confirmarPlantioRapido} className="modern-form">
                            <div className="form-group">
                                <label className="form-label">Quantidade de Sementes/Mudas</label>
                                <div className="input-with-icon">
                                    <Plus size={16} className="input-icon" />
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        placeholder="Ex: 50"
                                        value={dadosPlantioRapido.quantidadePlantada}
                                        onChange={e => setDadosPlantioRapido({...dadosPlantioRapido, quantidadePlantada: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Data de Início</label>
                                <div className="input-with-icon">
                                    <Clock size={16} className="input-icon" />
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={dadosPlantioRapido.dataPlantio}
                                        onChange={e => setDadosPlantioRapido({...dadosPlantioRapido, dataPlantio: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <button type="button" className="btn-outline" onClick={() => setModalPlantioAberto(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                                    Confirmar Plantio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;