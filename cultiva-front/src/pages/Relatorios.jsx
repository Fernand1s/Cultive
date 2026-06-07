import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    RefreshCw, FileSpreadsheet, TrendingUp, Bug, Package,
    MapPin, Users, BarChart3, ChevronDown, ChevronUp,
    AlertTriangle, CheckCircle2, Clock, Leaf, Zap, Target,
    Calendar, BookOpen, Shield, Search, Activity
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useNotify } from "../context/NotificationContext";
import '../css/Relatorios.css';
import {
    areaService, cultivoService, relatorioService, estoqueService,
    plantaService, userService, authService
} from "../services/api.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CORES = {
    verde: '#12620B',
    verdeClaro: '#22c55e',
    amarelo: '#f59e0b',
    vermelho: '#ef4444',
    azul: '#3b82f6',
    cinza: '#94a3b8',
    laranja: '#f97316',
};

const nivelCor = { CRITICO: CORES.vermelho, ALTO: CORES.laranja, MEDIO: CORES.amarelo, BAIXO: CORES.verdeClaro };

const formatarData = (str) => {
    if (!str) return '-';
    try { return new Date(str).toLocaleDateString('pt-BR'); } catch { return str; }
};

const BadgeNivel = ({ nivel }) => {
    const cores = { CRITICO: 'badge-critico', ALTO: 'badge-alto', MEDIO: 'badge-medio', BAIXO: 'badge-baixo', ALERTA: 'badge-alerta', OK: 'badge-ok' };
    return <span className={`rel-badge ${cores[nivel] || 'badge-ok'}`}>{nivel}</span>;
};

const KpiCard = ({ icon: Icon, label, value, cor = 'green' }) => (
    <div className="rel-kpi-card">
        <div className={`rel-kpi-icon icon-${cor}`}><Icon size={22} /></div>
        <div className="rel-kpi-text">
            <p>{label}</p>
            <h3>{value ?? '-'}</h3>
        </div>
    </div>
);

// ===================== TAB: PRODUÇÃO E SAFRA =====================

const TabProducao = ({ areas, cultivos, loading }) => {
    const notify = useNotify();
    const [produtividade, setProdutividade] = useState([]);
    const [caderno, setCaderno] = useState(null);
    const [cultivoSelecionado, setCultivoSelecionado] = useState('');
    const [idAreaFiltro, setIdAreaFiltro] = useState('');
    const [loadingLocal, setLoadingLocal] = useState(false);

    const carregarProdutividade = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const dados = await relatorioService.produtividade(idAreaFiltro || null);
            setProdutividade(Array.isArray(dados) ? dados : []);
        } catch { notify("Falha ao carregar dados de produtividade.", "error"); }
        finally { setLoadingLocal(false); }
    }, [idAreaFiltro, notify]);

    useEffect(() => { carregarProdutividade(); }, [carregarProdutividade]);

    const carregarCaderno = async (idCultivo) => {
        if (!idCultivo) { setCaderno(null); return; }
        setLoadingLocal(true);
        try {
            const dados = await relatorioService.cadernoCampo(idCultivo);
            setCaderno(dados);
        } catch { notify("Falha ao carregar caderno de campo.", "error"); }
        finally { setLoadingLocal(false); }
    };

    const stats = useMemo(() => {
        const colhidos = produtividade.filter(p => p.statusCultivo === 'COLHIDO' || p.statusCultivo === 'EM_PRODUCAO');
        const totalColhido = produtividade.reduce((s, p) => s + (p.quantidadeColhida || 0), 0);
        const prodMedia = produtividade
            .filter(p => p.produtividadeKgHa != null)
            .reduce((s, p, _, a) => s + p.produtividadeKgHa / a.length, 0);
        return { totalColhido: totalColhido.toFixed(1), prodMedia: prodMedia.toFixed(2), finalizados: colhidos.length };
    }, [produtividade]);

    const dadosGraficoProdutividade = useMemo(() => {
        const porArea = {};
        produtividade.forEach(p => {
            if (!porArea[p.nomeArea]) porArea[p.nomeArea] = { nome: p.nomeArea, produtividade: 0, colhido: 0 };
            porArea[p.nomeArea].colhido += p.quantidadeColhida || 0;
            if (p.produtividadeKgHa) {
                porArea[p.nomeArea].produtividade = Math.max(porArea[p.nomeArea].produtividade, p.produtividadeKgHa);
            }
        });
        return Object.values(porArea);
    }, [produtividade]);

    const statusCores = { ATIVO: CORES.verdeClaro, COLHIDO: CORES.azul, EM_PRODUCAO: CORES.verde, EM_PREPARO: CORES.amarelo, CANCELADO: CORES.cinza };

    return (
        <div className="rel-tab-content animate-fade">
            <div className="rel-filter-bar">
                <select className="rel-select" value={idAreaFiltro} onChange={e => setIdAreaFiltro(e.target.value)}>
                    <option value="">Todas as Áreas</option>
                    {areas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                </select>
                <button className="rel-btn btn-sync" onClick={carregarProdutividade} disabled={loadingLocal}>
                    <RefreshCw size={16} className={loadingLocal ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="rel-kpi-row">
                <KpiCard icon={TrendingUp} label="Total Colhido (kg)" value={stats.totalColhido} cor="green" />
                <KpiCard icon={Target} label="Produtividade Média (kg/ha)" value={stats.prodMedia} cor="blue" />
                <KpiCard icon={CheckCircle2} label="Cultivos com Colheita" value={stats.finalizados} cor="green" />
            </div>

            <div className="rel-charts-row">
                <div className="rel-chart-card">
                    <h3>Colheita Total por Área (kg)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={dadosGraficoProdutividade}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(v) => `${v} kg`} />
                            <Bar dataKey="colhido" name="Colhido" fill={CORES.verde} radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rel-chart-card">
                    <h3>Produtividade por Área (kg/ha)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={dadosGraficoProdutividade}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(v) => `${v} kg/ha`} />
                            <Bar dataKey="produtividade" name="kg/ha" fill={CORES.azul} radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rel-table-card">
                <h3>Detalhamento por Cultivo</h3>
                <div className="rel-table-wrapper">
                    <table className="rel-table">
                        <thead>
                            <tr><th>ID</th><th>Cultura</th><th>Área / Talhão</th><th>Plantio</th><th>Encerramento</th><th>Qtd. Colhida</th><th>Produtividade</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {produtividade.map(p => (
                                <tr key={p.idCultivo}>
                                    <td>#{p.idCultivo}</td>
                                    <td><strong>{p.nomePlanta}</strong></td>
                                    <td>{p.nomeArea}</td>
                                    <td>{formatarData(p.dataPlantio)}</td>
                                    <td>{formatarData(p.dataEncerramento)}</td>
                                    <td>{p.quantidadeColhida > 0 ? `${p.quantidadeColhida} kg` : '-'}</td>
                                    <td>{p.produtividadeKgHa != null ? `${p.produtividadeKgHa} kg/ha` : '-'}</td>
                                    <td><BadgeNivel nivel={p.statusCultivo?.replace('_', ' ')} /></td>
                                </tr>
                            ))}
                            {produtividade.length === 0 && <tr><td colSpan={8} className="rel-empty-row">Nenhum dado encontrado</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rel-caderno-section">
                <div className="rel-caderno-header">
                    <BookOpen size={20} />
                    <h3>Caderno de Campo — Rastreabilidade Completa</h3>
                </div>
                <div className="rel-filter-bar">
                    <select className="rel-select" value={cultivoSelecionado}
                        onChange={e => { setCultivoSelecionado(e.target.value); carregarCaderno(e.target.value); }}>
                        <option value="">Selecionar cultivo...</option>
                        {cultivos.map(c => (
                            <option key={c.idCultivo} value={c.idCultivo}>
                                #{c.idCultivo} — {c.plantaCultivada?.nomePopular} ({c.areaCultivo?.nomeArea})
                            </option>
                        ))}
                    </select>
                </div>
                {caderno && (
                    <div className="caderno-view animate-fade">
                        <div className="caderno-banner">
                            <div className="caderno-item"><span>Planta</span><strong>{caderno.nomePlanta}</strong><small>{caderno.nomeCientifico}</small></div>
                            <div className="caderno-item"><span>Área</span><strong>{caderno.nomeArea}</strong></div>
                            <div className="caderno-item"><span>Plantio</span><strong>{formatarData(caderno.dataPlantio)}</strong></div>
                            <div className="caderno-item"><span>Previsão Colheita</span><strong>{formatarData(caderno.previsaoColheita)}</strong></div>
                            <div className="caderno-item"><span>Status</span><BadgeNivel nivel={caderno.statusCultivo} /></div>
                            <div className="caderno-item"><span>Total Colhido</span><strong>{caderno.quantidadeColhida} {caderno.unidadeMedida}</strong></div>
                        </div>

                        <div className="caderno-grid">
                            <div className="caderno-card">
                                <h4><Bug size={16}/> Registros Fitossanitários ({caderno.pragas?.length || 0})</h4>
                                {caderno.pragas?.length === 0
                                    ? <p className="caderno-ok">Nenhuma praga ou doença registrada.</p>
                                    : caderno.pragas?.map((p, i) => (
                                        <div key={i} className="caderno-event">
                                            <div className="caderno-event-date">{formatarData(p.data)}</div>
                                            <div className="caderno-event-body">
                                                <strong>{p.nomePraga}</strong>
                                                <BadgeNivel nivel={p.nivel} />
                                                {p.observacao && <p>{p.observacao}</p>}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="caderno-card">
                                <h4><TrendingUp size={16}/> Colheitas Registradas ({caderno.colheitas?.length || 0})</h4>
                                {caderno.colheitas?.length === 0
                                    ? <p className="caderno-ok">Nenhuma colheita registrada ainda.</p>
                                    : caderno.colheitas?.map((c, i) => (
                                        <div key={i} className="caderno-event">
                                            <div className="caderno-event-date">{formatarData(c.dataHora)}</div>
                                            <div className="caderno-event-body">
                                                <strong>{c.quantidade} {c.unidadeMedida}</strong>
                                                {c.observacao && <p>{c.observacao}</p>}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="caderno-card">
                                <h4><Zap size={16}/> Irrigações e Responsáveis</h4>
                                <div className="caderno-specs">
                                    <div className="spec-row"><span>Total de Irrigações</span><strong>{caderno.totalIrrigacoes}</strong></div>
                                    <div className="spec-row"><span>Volume Total de Água</span><strong>{caderno.totalAguaLitros?.toFixed(1)} L</strong></div>
                                    <div className="spec-row"><span>Qtd. Plantada</span><strong>{caderno.quantidadePlantada} {caderno.unidadeMedida}</strong></div>
                                </div>
                                {caderno.responsaveis?.length > 0 && (
                                    <div className="caderno-responsaveis">
                                        <p>Equipe Responsável:</p>
                                        {caderno.responsaveis.map((r, i) => (
                                            <span key={i} className="user-tag"><CheckCircle2 size={11}/> {r}</span>
                                        ))}
                                    </div>
                                )}
                                {caderno.observacao && <p className="caderno-obs"><em>{caderno.observacao}</em></p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===================== TAB: FITOSSANITÁRIO =====================

const TabFitossanitario = ({ areas, plantas }) => {
    const notify = useNotify();
    const [incidencias, setIncidencias] = useState([]);
    const [idAreaFiltro, setIdAreaFiltro] = useState('');
    const [idPlantaFiltro, setIdPlantaFiltro] = useState('');
    const [loadingLocal, setLoadingLocal] = useState(false);

    const carregar = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const dados = await relatorioService.incidenciaPragas(idAreaFiltro || null, idPlantaFiltro || null);
            setIncidencias(Array.isArray(dados) ? dados : []);
        } catch { notify("Falha ao carregar incidência de pragas.", "error"); }
        finally { setLoadingLocal(false); }
    }, [idAreaFiltro, idPlantaFiltro, notify]);

    useEffect(() => { carregar(); }, [carregar]);

    const stats = useMemo(() => ({
        total: incidencias.reduce((s, i) => s + i.ocorrencias, 0),
        tiposUnicos: incidencias.length,
        criticos: incidencias.filter(i => i.nivelMaisGrave === 'CRITICO' || i.nivelMaisGrave === 'ALTO').length,
    }), [incidencias]);

    const dadosPizza = [
        { name: 'CRITICO', value: incidencias.filter(i => i.nivelMaisGrave === 'CRITICO').reduce((s,i)=>s+i.ocorrencias,0), fill: CORES.vermelho },
        { name: 'ALTO', value: incidencias.filter(i => i.nivelMaisGrave === 'ALTO').reduce((s,i)=>s+i.ocorrencias,0), fill: CORES.laranja },
        { name: 'MEDIO', value: incidencias.filter(i => i.nivelMaisGrave === 'MEDIO').reduce((s,i)=>s+i.ocorrencias,0), fill: CORES.amarelo },
        { name: 'BAIXO', value: incidencias.filter(i => i.nivelMaisGrave === 'BAIXO').reduce((s,i)=>s+i.ocorrencias,0), fill: CORES.verdeClaro },
    ].filter(d => d.value > 0);

    return (
        <div className="rel-tab-content animate-fade">
            <div className="rel-filter-bar">
                <select className="rel-select" value={idAreaFiltro} onChange={e => setIdAreaFiltro(e.target.value)}>
                    <option value="">Todas as Áreas</option>
                    {areas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                </select>
                <select className="rel-select" value={idPlantaFiltro} onChange={e => setIdPlantaFiltro(e.target.value)}>
                    <option value="">Todas as Plantas</option>
                    {plantas.map(p => <option key={p.idPlanta} value={p.idPlanta}>{p.nomePopular}</option>)}
                </select>
                <button className="rel-btn btn-sync" onClick={carregar} disabled={loadingLocal}>
                    <RefreshCw size={16} className={loadingLocal ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="rel-kpi-row">
                <KpiCard icon={Bug} label="Total de Ocorrências" value={stats.total} cor="red" />
                <KpiCard icon={AlertTriangle} label="Tipos de Pragas/Doenças" value={stats.tiposUnicos} cor="orange" />
                <KpiCard icon={Zap} label="Nível Alto ou Crítico" value={stats.criticos} cor="red" />
            </div>

            {incidencias.length === 0 ? (
                <div className="rel-empty-state">
                    <CheckCircle2 size={48} color={CORES.verdeClaro} />
                    <p>Nenhuma ocorrência fitossanitária registrada com os filtros atuais.</p>
                </div>
            ) : (
                <>
                    <div className="rel-charts-row">
                        <div className="rel-chart-card rel-chart-tall">
                            <h3>Frequência por Praga/Doença</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={incidencias.slice(0, 10)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="nomePraga" type="category" width={130} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => `${v} ocorrências`} />
                                    <Bar dataKey="ocorrencias" name="Ocorrências" radius={[0,4,4,0]}>
                                        {incidencias.slice(0,10).map((entry, i) => (
                                            <Cell key={i} fill={nivelCor[entry.nivelMaisGrave] || CORES.azul} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="rel-chart-card">
                            <h3>Distribuição por Severidade</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={dadosPizza} innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {dadosPizza.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rel-table-card">
                        <h3>Mapa Detalhado de Incidências</h3>
                        <div className="rel-table-wrapper">
                            <table className="rel-table">
                                <thead>
                                    <tr><th>Praga / Doença</th><th>Ocorrências</th><th>Nível Máximo</th><th>Área Mais Afetada</th><th>Planta Mais Afetada</th><th>Última Ocorrência</th></tr>
                                </thead>
                                <tbody>
                                    {incidencias.map((inc, i) => (
                                        <tr key={i}>
                                            <td><strong>{inc.nomePraga}</strong></td>
                                            <td className="text-center">{inc.ocorrencias}</td>
                                            <td><BadgeNivel nivel={inc.nivelMaisGrave} /></td>
                                            <td>{inc.areaMaisAfetada}</td>
                                            <td>{inc.plantaMaisAfetada}</td>
                                            <td>{formatarData(inc.ultimaOcorrencia)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ===================== TAB: ESTOQUE E CONSUMO =====================

const TabEstoque = () => {
    const notify = useNotify();
    const [alertas, setAlertas] = useState([]);
    const [estoqueCompleto, setEstoqueCompleto] = useState([]);
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [categoriaFiltro, setCategoriaFiltro] = useState('');

    const carregar = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const [al, es] = await Promise.all([
                relatorioService.alertasEstoque(),
                estoqueService.listar()
            ]);
            setAlertas(Array.isArray(al) ? al : []);
            setEstoqueCompleto(Array.isArray(es) ? es : []);
        } catch { notify("Falha ao carregar dados de estoque.", "error"); }
        finally { setLoadingLocal(false); }
    }, [notify]);

    useEffect(() => { carregar(); }, [carregar]);

    const stats = useMemo(() => ({
        criticos: alertas.filter(a => a.situacao === 'CRITICO').length,
        alerta: alertas.filter(a => a.situacao === 'ALERTA').length,
        ok: estoqueCompleto.length - alertas.length,
    }), [alertas, estoqueCompleto]);

    const maquinarios = useMemo(() =>
        estoqueCompleto.filter(e => e.categoria?.toLowerCase().includes('maquinario') || e.categoria?.toLowerCase().includes('maquinário')),
    [estoqueCompleto]);

    const porCategoria = useMemo(() => {
        const map = {};
        estoqueCompleto.forEach(e => {
            map[e.categoria] = (map[e.categoria] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [estoqueCompleto]);

    const alertasFiltrados = categoriaFiltro ? alertas.filter(a => a.categoria === categoriaFiltro) : alertas;

    return (
        <div className="rel-tab-content animate-fade">
            <div className="rel-filter-bar">
                <select className="rel-select" value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}>
                    <option value="">Todas as Categorias</option>
                    {[...new Set(alertas.map(a => a.categoria))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="rel-btn btn-sync" onClick={carregar} disabled={loadingLocal}>
                    <RefreshCw size={16} className={loadingLocal ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="rel-kpi-row">
                <KpiCard icon={AlertTriangle} label="Itens Críticos" value={stats.criticos} cor="red" />
                <KpiCard icon={Clock} label="Itens em Alerta" value={stats.alerta} cor="orange" />
                <KpiCard icon={CheckCircle2} label="Itens com Estoque OK" value={Math.max(0, stats.ok)} cor="green" />
            </div>

            <div className="rel-charts-row">
                <div className="rel-chart-card">
                    <h3>Itens por Categoria</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={porCategoria} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                                {porCategoria.map((_, i) => <Cell key={i} fill={[CORES.verde, CORES.azul, CORES.laranja, CORES.cinza][i % 4]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="rel-chart-card rel-alert-summary">
                    <h3>Resumo de Alertas</h3>
                    <div className="rel-alert-bar">
                        <div className="alert-seg seg-critico" style={{ width: `${stats.criticos / Math.max(1, alertas.length) * 100}%` }}></div>
                        <div className="alert-seg seg-alerta" style={{ width: `${stats.alerta / Math.max(1, alertas.length) * 100}%` }}></div>
                    </div>
                    <div className="alert-legend">
                        <span className="leg-item"><span className="leg-dot dot-critico"></span> Crítico: {stats.criticos}</span>
                        <span className="leg-item"><span className="leg-dot dot-alerta"></span> Alerta: {stats.alerta}</span>
                    </div>
                </div>
            </div>

            {alertasFiltrados.length === 0 ? (
                <div className="rel-empty-state">
                    <CheckCircle2 size={48} color={CORES.verdeClaro} />
                    <p>Nenhum item com estoque abaixo do mínimo!</p>
                </div>
            ) : (
                <div className="rel-table-card">
                    <h3><AlertTriangle size={16} /> Ponto de Pedido — Itens Abaixo do Mínimo</h3>
                    <div className="rel-table-wrapper">
                        <table className="rel-table">
                            <thead>
                                <tr><th>Item</th><th>Categoria</th><th>Atual</th><th>Mínimo</th><th>Déficit</th><th>Validade</th><th>Situação</th></tr>
                            </thead>
                            <tbody>
                                {alertasFiltrados.map(a => (
                                    <tr key={a.idEstoque}>
                                        <td><strong>{a.nome}</strong><br /><small>{a.subcategoria}</small></td>
                                        <td>{a.categoria}</td>
                                        <td>{a.quantidadeAtual} {a.unidadeMedida}</td>
                                        <td>{a.estoqueMinimo} {a.unidadeMedida}</td>
                                        <td className="text-red">-{a.deficit} {a.unidadeMedida}</td>
                                        <td>{a.validade || '-'}</td>
                                        <td><BadgeNivel nivel={a.situacao} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {maquinarios.length > 0 && (
                <div className="rel-table-card">
                    <h3><Zap size={16}/> Status de Maquinário</h3>
                    <div className="rel-table-wrapper">
                        <table className="rel-table">
                            <thead>
                                <tr><th>Maquinário</th><th>Modelo</th><th>Horímetro Atual</th><th>Revisão em</th><th>Combustível</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {maquinarios.map(m => (
                                    <tr key={m.idEstoque}>
                                        <td><strong>{m.nome}</strong></td>
                                        <td>{m.modelo || '-'}</td>
                                        <td>{m.horimetroAtual != null ? `${m.horimetroAtual}h` : '-'}</td>
                                        <td>{m.horasRevisao || '-'}</td>
                                        <td>{m.tipoCombustivel || '-'}</td>
                                        <td><BadgeNivel nivel={m.status || 'OK'} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===================== TAB: OCUPAÇÃO E SOLO =====================

const TabOcupacao = ({ areas }) => {
    const notify = useNotify();
    const [ocupacao, setOcupacao] = useState([]);
    const [rotacao, setRotacao] = useState([]);
    const [idAreaFiltro, setIdAreaFiltro] = useState('');
    const [areaExpandida, setAreaExpandida] = useState(null);
    const [loadingLocal, setLoadingLocal] = useState(false);

    const carregar = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const [oc, rot] = await Promise.all([
                relatorioService.ocupacaoAreas(),
                relatorioService.rotacaoCulturas(idAreaFiltro || null)
            ]);
            setOcupacao(Array.isArray(oc) ? oc : []);
            setRotacao(Array.isArray(rot) ? rot : []);
        } catch { notify("Falha ao carregar dados de ocupação.", "error"); }
        finally { setLoadingLocal(false); }
    }, [idAreaFiltro, notify]);

    useEffect(() => { carregar(); }, [carregar]);

    const stats = useMemo(() => ({
        mediaOcupacao: ocupacao.length > 0
            ? (ocupacao.reduce((s, o) => s + o.taxaOcupacao, 0) / ocupacao.length).toFixed(1)
            : 0,
        areasOciosas: ocupacao.filter(o => o.taxaOcupacao < 20).length,
        totalRotacoes: rotacao.reduce((s, r) => s + r.historico.length, 0),
    }), [ocupacao, rotacao]);

    const rotacaoFiltrada = idAreaFiltro
        ? rotacao.filter(r => r.idArea === parseInt(idAreaFiltro))
        : rotacao;

    return (
        <div className="rel-tab-content animate-fade">
            <div className="rel-filter-bar">
                <select className="rel-select" value={idAreaFiltro} onChange={e => setIdAreaFiltro(e.target.value)}>
                    <option value="">Todas as Áreas</option>
                    {areas.map(a => <option key={a.idArea} value={a.idArea}>{a.nomeArea}</option>)}
                </select>
                <button className="rel-btn btn-sync" onClick={carregar} disabled={loadingLocal}>
                    <RefreshCw size={16} className={loadingLocal ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="rel-kpi-row">
                <KpiCard icon={Activity} label="Taxa Média de Ocupação" value={`${stats.mediaOcupacao}%`} cor="green" />
                <KpiCard icon={AlertTriangle} label="Áreas com Baixa Ocupação" value={stats.areasOciosas} cor="orange" />
                <KpiCard icon={TrendingUp} label="Total de Ciclos Registrados" value={stats.totalRotacoes} cor="blue" />
            </div>

            <div className="rel-chart-card">
                <h3>Taxa de Ocupação por Área (%)</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ocupacao}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nomeArea" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="taxaOcupacao" name="Ocupação" radius={[4,4,0,0]}>
                            {ocupacao.map((entry, i) => (
                                <Cell key={i} fill={entry.taxaOcupacao >= 60 ? CORES.verde : entry.taxaOcupacao >= 30 ? CORES.amarelo : CORES.vermelho} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="rel-table-card">
                <h3>Estatísticas de Ocupação</h3>
                <div className="rel-table-wrapper">
                    <table className="rel-table">
                        <thead>
                            <tr><th>Área</th><th>Tamanho (ha)</th><th>Status Atual</th><th>Dias Ocupado</th><th>Dias Ocioso</th><th>Nº Cultivos</th><th>Taxa Ocupação</th></tr>
                        </thead>
                        <tbody>
                            {ocupacao.map(o => (
                                <tr key={o.idArea}>
                                    <td><strong>{o.nomeArea}</strong></td>
                                    <td>{o.tamanhoArea || '-'}</td>
                                    <td><BadgeNivel nivel={o.statusAtual} /></td>
                                    <td>{o.diasOcupadoTotal}</td>
                                    <td>{o.diasOciosoTotal}</td>
                                    <td className="text-center">{o.totalCultivos}</td>
                                    <td>
                                        <div className="mini-progress">
                                            <div className="mini-bar" style={{ width: `${o.taxaOcupacao}%`, background: o.taxaOcupacao >= 60 ? CORES.verde : o.taxaOcupacao >= 30 ? CORES.amarelo : CORES.vermelho }}></div>
                                        </div>
                                        <span>{o.taxaOcupacao}%</span>
                                    </td>
                                </tr>
                            ))}
                            {ocupacao.length === 0 && <tr><td colSpan={7} className="rel-empty-row">Nenhuma área encontrada</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rel-table-card">
                <h3>Histórico de Rotação de Culturas</h3>
                {rotacaoFiltrada.map(r => (
                    <div key={r.idArea} className="rotacao-area">
                        <button className="rotacao-header" onClick={() => setAreaExpandida(areaExpandida === r.idArea ? null : r.idArea)}>
                            <div className="rotacao-area-info">
                                <MapPin size={16} />
                                <strong>{r.nomeArea}</strong>
                                <span className="rotacao-ciclos">{r.historico.length} ciclo(s)</span>
                            </div>
                            {areaExpandida === r.idArea ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        </button>
                        {areaExpandida === r.idArea && (
                            <div className="rotacao-timeline animate-fade">
                                {r.historico.length === 0
                                    ? <p className="rel-empty-row">Nenhum cultivo registrado nesta área.</p>
                                    : r.historico.map((ciclo, i) => (
                                        <div key={i} className="rotacao-ciclo">
                                            <div className="ciclo-marker"></div>
                                            <div className="ciclo-content">
                                                <strong>{ciclo.nomePlanta}</strong>
                                                <span className="ciclo-datas">{formatarData(ciclo.dataPlantio)} → {formatarData(ciclo.dataEncerramento) || 'Em curso'}</span>
                                                <div className="ciclo-meta">
                                                    <BadgeNivel nivel={ciclo.statusCultivo} />
                                                    {ciclo.quantidadeColhida > 0 && <span>{ciclo.quantidadeColhida} {ciclo.unidadeMedida} colhidos</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                ))}
                {rotacaoFiltrada.length === 0 && <p className="rel-empty-row">Nenhuma rotação encontrada.</p>}
            </div>
        </div>
    );
};

// ===================== TAB: EQUIPE E OPERAÇÕES =====================

const TabEquipe = ({ usuario }) => {
    const notify = useNotify();
    const [desempenho, setDesempenho] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [mostrarLogs, setMostrarLogs] = useState(false);
    const isAdmin = usuario?.funcao === 'ADMINISTRADOR' || usuario?.funcao === 'EMPRESA';

    const carregar = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const d = await relatorioService.desempenhoEquipe();
            setDesempenho(Array.isArray(d) ? d : []);
        } catch { notify("Falha ao carregar desempenho da equipe.", "error"); }
        finally { setLoadingLocal(false); }
    }, [notify]);

    const carregarLogs = useCallback(async () => {
        try {
            const l = await userService.listarLogs();
            setLogs(Array.isArray(l) ? l.slice(0, 100) : []);
        } catch { notify("Falha ao carregar logs de auditoria.", "error"); }
    }, [notify]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => {
        if (mostrarLogs && isAdmin) carregarLogs();
    }, [mostrarLogs, isAdmin, carregarLogs]);

    const stats = useMemo(() => ({
        totalTarefas: desempenho.reduce((s, d) => s + d.tarefasTotal, 0),
        taxaMedia: desempenho.length > 0
            ? (desempenho.reduce((s, d) => s + d.taxaConclusao, 0) / desempenho.length).toFixed(1)
            : 0,
        mediaResolucao: desempenho.length > 0
            ? (desempenho.reduce((s, d) => s + (d.tempoMedioResolucaoDias || 0), 0) / desempenho.length).toFixed(1)
            : 0,
    }), [desempenho]);

    const CORES_BARS = [CORES.verde, CORES.azul, CORES.laranja, CORES.vermelho, CORES.cinza];

    return (
        <div className="rel-tab-content animate-fade">
            <div className="rel-filter-bar">
                <button className="rel-btn btn-sync" onClick={carregar} disabled={loadingLocal}>
                    <RefreshCw size={16} className={loadingLocal ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="rel-kpi-row">
                <KpiCard icon={Users} label="Total de Tarefas" value={stats.totalTarefas} cor="blue" />
                <KpiCard icon={CheckCircle2} label="Taxa Média de Conclusão" value={`${stats.taxaMedia}%`} cor="green" />
                <KpiCard icon={Clock} label="Tempo Médio de Resolução" value={`${stats.mediaResolucao} dias`} cor="orange" />
            </div>

            {desempenho.length > 0 && (
                <div className="rel-charts-row">
                    <div className="rel-chart-card">
                        <h3>Tarefas por Responsável</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={desempenho.map(d => ({ nome: d.nomeUsuario, concluidas: d.tarefasConcluidas, pendentes: d.tarefasPendentes, atrasadas: d.tarefasAtrasadas }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="concluidas" name="Concluídas" fill={CORES.verdeClaro} radius={[4,4,0,0]} stackId="a" />
                                <Bar dataKey="pendentes" name="Pendentes" fill={CORES.azul} stackId="a" />
                                <Bar dataKey="atrasadas" name="Atrasadas" fill={CORES.vermelho} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="rel-chart-card">
                        <h3>Taxa de Conclusão (%)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={desempenho.map(d => ({ nome: d.nomeUsuario, taxa: d.taxaConclusao }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Bar dataKey="taxa" name="Taxa %" radius={[4,4,0,0]}>
                                    {desempenho.map((_, i) => <Cell key={i} fill={CORES_BARS[i % CORES_BARS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="rel-table-card">
                <h3>Desempenho Individual da Equipe</h3>
                <div className="rel-table-wrapper">
                    <table className="rel-table">
                        <thead>
                            <tr><th>Membro</th><th>Função</th><th>Total</th><th>Concluídas</th><th>Atrasadas</th><th>Canceladas</th><th>Pendentes</th><th>Taxa</th><th>Tempo Médio</th></tr>
                        </thead>
                        <tbody>
                            {desempenho.map(d => (
                                <tr key={d.idUsuario}>
                                    <td><strong>{d.nomeUsuario}</strong></td>
                                    <td>{d.funcao}</td>
                                    <td className="text-center">{d.tarefasTotal}</td>
                                    <td className="text-center text-green">{d.tarefasConcluidas}</td>
                                    <td className="text-center text-red">{d.tarefasAtrasadas}</td>
                                    <td className="text-center text-gray">{d.tarefasCanceladas}</td>
                                    <td className="text-center">{d.tarefasPendentes}</td>
                                    <td>
                                        <div className="mini-progress">
                                            <div className="mini-bar" style={{ width: `${d.taxaConclusao}%`, background: d.taxaConclusao >= 75 ? CORES.verde : d.taxaConclusao >= 50 ? CORES.amarelo : CORES.vermelho }}></div>
                                        </div>
                                        <span>{d.taxaConclusao}%</span>
                                    </td>
                                    <td>{d.tempoMedioResolucaoDias > 0 ? `${d.tempoMedioResolucaoDias} dias` : '-'}</td>
                                </tr>
                            ))}
                            {desempenho.length === 0 && <tr><td colSpan={9} className="rel-empty-row">Nenhum dado de equipe disponível</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAdmin && (
                <div className="rel-table-card">
                    <button className="rel-logs-toggle" onClick={() => setMostrarLogs(!mostrarLogs)}>
                        <Shield size={18} /> Auditoria e Logs do Sistema
                        {mostrarLogs ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                    {mostrarLogs && (
                        <div className="rel-logs-view animate-fade">
                            <div className="rel-table-wrapper">
                                <table className="rel-table">
                                    <thead>
                                        <tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, i) => (
                                            <tr key={i}>
                                                <td className="log-date">{formatarData(log.dataHora || log.data)}</td>
                                                <td><strong>{log.nomeUsuario || log.usuario || 'Sistema'}</strong></td>
                                                <td><span className="log-acao">{log.acao}</span></td>
                                                <td className="log-detalhes">{log.detalhes}</td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && <tr><td colSpan={4} className="rel-empty-row">Nenhum log encontrado</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ===================== PDF HELPERS =====================

const PDF_C = {
    verde:  [18, 98, 11],
    cinza:  [71, 85, 105],
    branco: [255, 255, 255],
    navy:   [15, 23, 42],
};

const pdfCabecalho = (doc, titulo) => {
    const [rV, gV, bV] = PDF_C.verde;
    const [rW, gW, bW] = PDF_C.branco;
    const [rS, gS, bS] = PDF_C.cinza;
    doc.setFillColor(rV, gV, bV);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(rW, gW, bW);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CultivaMais", 15, 17);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`RELATÓRIO — ${titulo.toUpperCase()}`, 15, 26);
    doc.text("Sistema de Gestão Agrícola Integrado", 15, 33);
    doc.setFontSize(7.5);
    doc.setTextColor(rW, gW, bW);
    doc.text(`EMISSÃO: ${new Date().toLocaleString('pt-BR')}`, 132, 24);
    doc.text(`PROTOCOLO: REL-${Date.now().toString().slice(-6)}`, 132, 30);
};

const pdfRodape = (doc) => {
    const [rS, gS, bS] = PDF_C.cinza;
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 282, 195, 282);
        doc.setFontSize(7);
        doc.setTextColor(rS, gS, bS);
        doc.text("CultivaMais Platform — Software de Gestão Agrícola", 15, 287);
        doc.text(`Página ${i} de ${n}`, 195, 287, { align: 'right' });
    }
};

const pdfKpis = (doc, kpis, y) => {
    const [rV, gV, bV] = PDF_C.verde;
    const [rS, gS, bS] = PDF_C.cinza;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 180, 30, 2, 2, 'FD');
    const w = 180 / kpis.length;
    kpis.forEach((kpi, i) => {
        const x = 15 + i * w + 7;
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(rS, gS, bS);
        doc.text(kpi.label.toUpperCase(), x, y + 9);
        doc.setFontSize(14);
        doc.setTextColor(rV, gV, bV);
        doc.text(String(kpi.valor ?? '-'), x, y + 22);
    });
    return y + 37;
};

const pdfTitulo = (doc, texto, y) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_C.navy);
    doc.text(texto, 15, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, 195, y + 2);
    return y + 8;
};

const TABLE_BASE = {
    theme: 'striped',
    headStyles: { fillColor: [18, 98, 11], fontSize: 8, halign: 'center', cellPadding: 3.5, textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 3, valign: 'middle', font: 'helvetica', textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 },
};

// ===================== COMPONENTE PRINCIPAL =====================

const TABS = [
    { id: 'producao', label: 'Produção e Safra', icon: TrendingUp },
    { id: 'fitossanitario', label: 'Fitossanitário', icon: Bug },
    { id: 'estoque', label: 'Estoque e Consumo', icon: Package },
    { id: 'ocupacao', label: 'Ocupação e Solo', icon: MapPin },
    { id: 'equipe', label: 'Equipe e Operações', icon: Users },
];

const Relatorios = () => {
    const notify = useNotify();
    const [abaAtiva, setAbaAtiva] = useState('producao');
    const [areas, setAreas] = useState([]);
    const [cultivos, setCultivos] = useState([]);
    const [plantas, setPlantas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const usuario = authService.obterUsuarioLogado();

    const carregarDadosBase = useCallback(async () => {
        setLoading(true);
        try {
            const [dAreas, dCultivos, dPlantas] = await Promise.all([
                areaService.listar(),
                cultivoService.listar(),
                plantaService.listar(),
            ]);
            setAreas(Array.isArray(dAreas) ? dAreas : []);
            setCultivos(Array.isArray(dCultivos) ? dCultivos : []);
            setPlantas(Array.isArray(dPlantas) ? dPlantas : []);
        } catch { notify("Erro ao carregar dados base.", "error"); }
        finally { setLoading(false); }
    }, [notify]);

    useEffect(() => { carregarDadosBase(); }, [carregarDadosBase]);

    const gerarPDF = async () => {
        const usuarioLogado = authService.obterUsuarioLogado();
        const idUsuario = usuarioLogado?.idUsuario || usuarioLogado?.id;
        const tabAtual = TABS.find(t => t.id === abaAtiva);

        setLoadingPDF(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            pdfCabecalho(doc, tabAtual?.label || abaAtiva);
            let y = 48;

            // ---- PRODUÇÃO E SAFRA ----
            if (abaAtiva === 'producao') {
                const dados = await relatorioService.produtividade(null);
                const totalColhido = dados.reduce((s, p) => s + (p.quantidadeColhida || 0), 0).toFixed(1);
                const comProd = dados.filter(p => p.produtividadeKgHa != null);
                const prodMedia = comProd.length > 0
                    ? (comProd.reduce((s, p) => s + p.produtividadeKgHa, 0) / comProd.length).toFixed(2)
                    : '0.00';
                const finalizados = dados.filter(p => p.statusCultivo === 'COLHIDO').length;

                y = pdfKpis(doc, [
                    { label: 'Total Colhido', valor: `${totalColhido} kg` },
                    { label: 'Produtividade Média', valor: `${prodMedia} kg/ha` },
                    { label: 'Cultivos com Colheita', valor: finalizados },
                ], y);
                y = pdfTitulo(doc, 'Detalhamento por Cultivo', y);

                autoTable(doc, {
                    ...TABLE_BASE, startY: y,
                    head: [['ID', 'CULTURA', 'ÁREA / TALHÃO', 'PLANTIO', 'ENCERRAMENTO', 'COLHIDO', 'PRODUTIVIDADE', 'STATUS']],
                    body: dados.map(p => [
                        `#${p.idCultivo}`,
                        p.nomePlanta || 'N/A',
                        p.nomeArea || 'N/A',
                        p.dataPlantio ? new Date(p.dataPlantio).toLocaleDateString('pt-BR') : '-',
                        p.dataEncerramento ? new Date(p.dataEncerramento).toLocaleDateString('pt-BR') : '-',
                        p.quantidadeColhida > 0 ? `${p.quantidadeColhida} kg` : '-',
                        p.produtividadeKgHa != null ? `${p.produtividadeKgHa} kg/ha` : '-',
                        (p.statusCultivo || 'N/A').replace(/_/g, ' '),
                    ]),
                    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
                    didParseCell: (data) => {
                        if (data.section !== 'body' || data.column.index !== 7) return;
                        const v = data.cell.raw;
                        if (v === 'COLHIDO') data.cell.styles.textColor = [30, 64, 175];
                        else if (v === 'ATIVO') data.cell.styles.textColor = [21, 128, 61];
                        else if (v === 'CANCELADO') data.cell.styles.textColor = [100, 116, 139];
                    }
                });
            }

            // ---- FITOSSANITÁRIO ----
            else if (abaAtiva === 'fitossanitario') {
                const dados = await relatorioService.incidenciaPragas(null, null);
                const totalOcor = dados.reduce((s, d) => s + d.ocorrencias, 0);
                const criticos = dados.filter(d => d.nivelMaisGrave === 'CRITICO' || d.nivelMaisGrave === 'ALTO').length;

                y = pdfKpis(doc, [
                    { label: 'Total de Ocorrências', valor: totalOcor },
                    { label: 'Tipos de Pragas/Doenças', valor: dados.length },
                    { label: 'Nível Alto ou Crítico', valor: criticos },
                ], y);
                y = pdfTitulo(doc, 'Mapa de Incidência de Pragas e Doenças', y);

                autoTable(doc, {
                    ...TABLE_BASE, startY: y,
                    head: [['PRAGA / DOENÇA', 'OCORRÊNCIAS', 'NÍVEL MÁXIMO', 'ÁREA MAIS AFETADA', 'PLANTA MAIS AFETADA', 'ÚLTIMA OCORRÊNCIA']],
                    body: dados.map(d => [
                        d.nomePraga,
                        d.ocorrencias,
                        d.nivelMaisGrave || 'N/A',
                        d.areaMaisAfetada || 'N/A',
                        d.plantaMaisAfetada || 'N/A',
                        d.ultimaOcorrencia ? new Date(d.ultimaOcorrencia).toLocaleDateString('pt-BR') : '-',
                    ]),
                    columnStyles: { 1: { halign: 'center' } },
                    didParseCell: (data) => {
                        if (data.section !== 'body' || data.column.index !== 2) return;
                        const v = data.cell.raw;
                        if (v === 'CRITICO') data.cell.styles.textColor = [153, 27, 27];
                        else if (v === 'ALTO') data.cell.styles.textColor = [154, 52, 18];
                        else if (v === 'MEDIO') data.cell.styles.textColor = [133, 77, 14];
                        else if (v === 'BAIXO') data.cell.styles.textColor = [22, 101, 52];
                    }
                });
            }

            // ---- ESTOQUE E CONSUMO ----
            else if (abaAtiva === 'estoque') {
                const [alertas, estoqueCompleto] = await Promise.all([
                    relatorioService.alertasEstoque(),
                    estoqueService.listar(),
                ]);
                const maquinarios = estoqueCompleto.filter(e =>
                    e.categoria?.toLowerCase().includes('maquinario') ||
                    e.categoria?.toLowerCase().includes('maquinário')
                );
                const criticos = alertas.filter(a => a.situacao === 'CRITICO').length;
                const emAlerta = alertas.filter(a => a.situacao === 'ALERTA').length;

                y = pdfKpis(doc, [
                    { label: 'Itens Críticos', valor: criticos },
                    { label: 'Itens em Alerta', valor: emAlerta },
                    { label: 'Total no Estoque', valor: estoqueCompleto.length },
                ], y);

                if (alertas.length > 0) {
                    y = pdfTitulo(doc, 'Ponto de Pedido — Itens Abaixo do Estoque Mínimo', y);
                    autoTable(doc, {
                        ...TABLE_BASE, startY: y,
                        head: [['ITEM', 'CATEGORIA', 'ATUAL', 'MÍNIMO', 'DÉFICIT', 'UNIDADE', 'VALIDADE', 'SITUAÇÃO']],
                        body: alertas.map(a => [
                            a.nome, a.categoria || '-', a.quantidadeAtual ?? '-', a.estoqueMinimo ?? '-',
                            a.deficit != null ? `-${a.deficit}` : '-',
                            a.unidadeMedida || '-', a.validade || '-', a.situacao,
                        ]),
                        columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
                        didParseCell: (data) => {
                            if (data.section !== 'body' || data.column.index !== 7) return;
                            const v = data.cell.raw;
                            if (v === 'CRITICO') data.cell.styles.textColor = [153, 27, 27];
                            else if (v === 'ALERTA') data.cell.styles.textColor = [146, 64, 14];
                        }
                    });
                } else {
                    y = pdfTitulo(doc, 'Alertas de Estoque', y);
                    doc.setFontSize(9);
                    doc.setTextColor(...PDF_C.cinza);
                    doc.setFont("helvetica", "italic");
                    doc.text('Nenhum item abaixo do estoque mínimo. Estoque regularizado.', 15, y + 6);
                    y += 16;
                }

                if (maquinarios.length > 0) {
                    const yBase = alertas.length > 0 ? doc.lastAutoTable.finalY + 12 : y;
                    const yMaq = yBase > 248 ? (doc.addPage(), 20) : yBase;
                    pdfTitulo(doc, 'Status de Maquinário', yMaq);
                    autoTable(doc, {
                        ...TABLE_BASE, startY: yMaq + 8,
                        head: [['MAQUINÁRIO', 'MODELO', 'HORÍMETRO ATUAL', 'REVISÃO EM', 'COMBUSTÍVEL', 'STATUS']],
                        body: maquinarios.map(m => [
                            m.nome, m.modelo || '-',
                            m.horimetroAtual != null ? `${m.horimetroAtual}h` : '-',
                            m.horasRevisao || '-', m.tipoCombustivel || '-', m.status || '-',
                        ]),
                    });
                }
            }

            // ---- OCUPAÇÃO E SOLO ----
            else if (abaAtiva === 'ocupacao') {
                const [ocupacao, rotacao] = await Promise.all([
                    relatorioService.ocupacaoAreas(),
                    relatorioService.rotacaoCulturas(null),
                ]);
                const mediaOcup = ocupacao.length > 0
                    ? (ocupacao.reduce((s, o) => s + o.taxaOcupacao, 0) / ocupacao.length).toFixed(1) : 0;
                const areasOciosas = ocupacao.filter(o => o.taxaOcupacao < 20).length;
                const totalCiclos = rotacao.reduce((s, r) => s + r.historico.length, 0);

                y = pdfKpis(doc, [
                    { label: 'Taxa Média de Ocupação', valor: `${mediaOcup}%` },
                    { label: 'Áreas com Baixa Ocupação', valor: areasOciosas },
                    { label: 'Total de Ciclos Registrados', valor: totalCiclos },
                ], y);
                y = pdfTitulo(doc, 'Estatísticas de Ocupação por Área', y);

                autoTable(doc, {
                    ...TABLE_BASE, startY: y,
                    head: [['ÁREA', 'TAMANHO (ha)', 'STATUS ATUAL', 'DIAS OCUPADO', 'DIAS OCIOSO', 'Nº CULTIVOS', 'TAXA OCUPAÇÃO']],
                    body: ocupacao.map(o => [
                        o.nomeArea, o.tamanhoArea ?? '-',
                        (o.statusAtual || 'N/A').replace(/_/g, ' '),
                        o.diasOcupadoTotal ?? 0, o.diasOciosoTotal ?? 0,
                        o.totalCultivos ?? 0, `${o.taxaOcupacao ?? 0}%`,
                    ]),
                    columnStyles: {
                        1: { halign: 'center' }, 3: { halign: 'center' },
                        4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' },
                    },
                    didParseCell: (data) => {
                        if (data.section !== 'body' || data.column.index !== 6) return;
                        const pct = parseFloat(data.cell.raw);
                        if (pct >= 60) data.cell.styles.textColor = [21, 128, 61];
                        else if (pct >= 30) data.cell.styles.textColor = [133, 77, 14];
                        else data.cell.styles.textColor = [153, 27, 27];
                    }
                });

                const yRot = doc.lastAutoTable.finalY + 12;
                const yRotStart = yRot > 240 ? (doc.addPage(), 20) : yRot;
                pdfTitulo(doc, 'Histórico de Rotação de Culturas', yRotStart);
                autoTable(doc, {
                    ...TABLE_BASE, startY: yRotStart + 8,
                    head: [['ÁREA', 'TAMANHO (ha)', 'CICLOS', 'SEQUÊNCIA DE CULTURAS']],
                    body: rotacao.map(r => [
                        r.nomeArea, r.tamanhoArea ?? '-', r.historico.length,
                        r.historico.map(h =>
                            `${h.nomePlanta} (${h.dataPlantio ? new Date(h.dataPlantio).getFullYear() : '?'})`
                        ).join(' → ') || '-',
                    ]),
                    columnStyles: { 3: { cellWidth: 85 } },
                });
            }

            // ---- EQUIPE E OPERAÇÕES ----
            else if (abaAtiva === 'equipe') {
                const dados = await relatorioService.desempenhoEquipe();
                const totalTarefas = dados.reduce((s, d) => s + d.tarefasTotal, 0);
                const taxaMedia = dados.length > 0
                    ? (dados.reduce((s, d) => s + d.taxaConclusao, 0) / dados.length).toFixed(1) : 0;
                const mediaResolucao = dados.length > 0
                    ? (dados.reduce((s, d) => s + (d.tempoMedioResolucaoDias || 0), 0) / dados.length).toFixed(1) : 0;

                y = pdfKpis(doc, [
                    { label: 'Total de Tarefas', valor: totalTarefas },
                    { label: 'Taxa Média de Conclusão', valor: `${taxaMedia}%` },
                    { label: 'Tempo Médio de Resolução', valor: `${mediaResolucao} dias` },
                ], y);
                y = pdfTitulo(doc, 'Desempenho Operacional da Equipe', y);

                autoTable(doc, {
                    ...TABLE_BASE, startY: y,
                    head: [['MEMBRO', 'FUNÇÃO', 'TOTAL', 'CONCLUÍDAS', 'ATRASADAS', 'CANCELADAS', 'PENDENTES', 'TAXA', 'TEMPO MÉD.']],
                    body: dados.map(d => [
                        d.nomeUsuario, d.funcao || 'N/A',
                        d.tarefasTotal ?? 0, d.tarefasConcluidas ?? 0, d.tarefasAtrasadas ?? 0,
                        d.tarefasCanceladas ?? 0, d.tarefasPendentes ?? 0,
                        `${d.taxaConclusao ?? 0}%`,
                        d.tempoMedioResolucaoDias > 0 ? `${d.tempoMedioResolucaoDias}d` : '-',
                    ]),
                    columnStyles: {
                        2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' },
                        5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
                    },
                    didParseCell: (data) => {
                        if (data.section !== 'body') return;
                        if (data.column.index === 4 && parseInt(data.cell.raw) > 0)
                            data.cell.styles.textColor = [153, 27, 27];
                        if (data.column.index === 3 && parseInt(data.cell.raw) > 0)
                            data.cell.styles.textColor = [21, 128, 61];
                    }
                });
            }

            pdfRodape(doc);

            await userService.registrarLog(
                "Exportação de Relatório PDF",
                `Exportou relatório '${tabAtual?.label}' em PDF — ${new Date().toLocaleDateString('pt-BR')}`,
                idUsuario
            );

            doc.save(`CULTIVA_${abaAtiva.toUpperCase()}_${Date.now()}.pdf`);
            notify("Relatório PDF gerado e salvo com sucesso.", "success");
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            notify("Falha ao gerar documento PDF.", "error");
        } finally {
            setLoadingPDF(false);
        }
    };

    return (
        <div className="main-content reports-page-wrapper">
            <header className="bi-header">
                <div>
                    <h1 className="main-title">Relatórios</h1>
                    <p className="sub-title">Análise de Produção, Fitossanidade, Estoque, Ocupação e Equipe</p>
                </div>
                <div className="bi-action-group">
                    <button className="rel-btn btn-sync" onClick={carregarDadosBase} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        {loading ? 'Carregando...' : 'Sincronizar'}
                    </button>
                    <button className="rel-btn btn-export" onClick={gerarPDF} disabled={loadingPDF}>
                        <FileSpreadsheet size={18} className={loadingPDF ? 'spin' : ''} />
                        {loadingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
                    </button>
                </div>
            </header>

            <nav className="rel-tabs-nav">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`rel-tab-btn ${abaAtiva === tab.id ? 'active' : ''}`}
                            onClick={() => setAbaAtiva(tab.id)}
                        >
                            <Icon size={17} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            <section className="rel-section">
                {abaAtiva === 'producao' && <TabProducao areas={areas} cultivos={cultivos} loading={loading} />}
                {abaAtiva === 'fitossanitario' && <TabFitossanitario areas={areas} plantas={plantas} />}
                {abaAtiva === 'estoque' && <TabEstoque />}
                {abaAtiva === 'ocupacao' && <TabOcupacao areas={areas} />}
                {abaAtiva === 'equipe' && <TabEquipe usuario={usuario} />}
            </section>
        </div>
    );
};

export default Relatorios;
