import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Droplets, Bug, RefreshCw, CheckCircle2, Activity,
    TrendingUp, Search, Calendar, AlertTriangle, Leaf,
    Zap, FileSpreadsheet, Target, Users, ClipboardCheck
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useNotify } from "../context/NotificationContext";
import '../css/Relatorios.css';

import { areaService, cultivoService, relatorioService, userService, authService} from "../services/api.js";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Relatorios = () => {
    const notify = useNotify();

    // Estados de Dados Primários
    const [areas, setAreas] = useState([]);
    const [cultivosTotal, setCultivosTotal] = useState([]);
    const [abaAtiva, setAbaAtiva] = useState('geral');
    const [loading, setLoading] = useState(false);
    const [performanceArea, setPerformanceArea] = useState(null);

    // Filtros
    const [statusFiltro, setStatusFiltro] = useState('TODOS');
    const [areaSelecionadaId, setAreaSelecionadaId] = useState('');
    const [cultivoSelecionado, setCultivoSelecionado] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');

    // Dados de Análise
    const [distribuicaoSaude, setDistribuicaoSaude] = useState([]);
    const [detalhesLote, setDetalhesLote] = useState({
        totalAgua: 0,
        historicoPragas: [],
        previsaoColheita: null,
        compatibilidade: false
    });

    const sincronizarBancoDeDados = useCallback(async () => {
        setLoading(prev => {
            if (prev) return prev;
            return true;
        });

        try {
            const [dAreas, dCultivos] = await Promise.all([
                areaService.listar(),
                cultivoService.listar()
            ]);

            setAreas(Array.isArray(dAreas) ? dAreas : []);
            setCultivosTotal(Array.isArray(dCultivos) ? dCultivos : []);

            // No arquivo Relatorios.js, dentro de sincronizarBancoDeDados
            const categorias = [
                {
                    name: 'Saudável',
                    value: dCultivos.filter(c => c.estadoPlanta === 'SAUDAVEL').length,
                    fill: '#22c55e'
                },
                {
                    name: 'Alerta/Praga',
                    // Aqui unificamos os novos estados que você criou no componente de Cultivos
                    value: dCultivos.filter(c => ['ALERTA', 'EM_ATENCAO', 'PRAGA'].includes(c.estadoPlanta)).length,
                    fill: '#f59e0b'
                },
                {
                    name: 'Crítico',
                    value: dCultivos.filter(c => c.estadoPlanta === 'CRITICO').length,
                    fill: '#ef4444'
                }
            ];
            setDistribuicaoSaude(categorias);

            notify("Inteligência de campo atualizada.", "success");
        } catch (err) {
            notify("Falha na sincronização de dados técnicos.", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        sincronizarBancoDeDados();
    }, [sincronizarBancoDeDados]);

    const analisarLoteDeep = async (cultivo) => {
        // 1. Bloqueio de múltiplas requisições simultâneas e validação de entrada
        if (loading || !cultivo) return;

        setLoading(true);
        setCultivoSelecionado(cultivo);
        setPerformanceArea(null); // Limpa o estado de colheita anterior

        // Reset de estado visual (Feedback de UX)
        setDetalhesLote({
            totalAgua: 0,
            historicoPragas: [],
            previsaoColheita: 'Calculando...',
            compatibilidade: false
        });

        try {
            // 2. Chamadas de telemetria e BI em paralelo para máxima performance
            const [aguaDTO, pragasVal, compatVal, colheitaData] = await Promise.all([
                relatorioService.consumoAgua(cultivo.idCultivo),
                relatorioService.historicoPragas(cultivo.idCultivo),
                relatorioService.compatibilidade(
                    cultivo.plantaCultivada?.idPlanta,
                    cultivo.areaCultivo?.idArea
                ),
                relatorioService.colheitaPorArea(cultivo.areaCultivo?.idArea)
            ]);

            // 3. Processamento de Data de Colheita (Lógica de Negócio)
            let dataPrevista = cultivo.previsaoColheita || cultivo.dataColheitaFinal;

            if (!dataPrevista && cultivo.dataPlantio) {
                const dataPlantio = new Date(cultivo.dataPlantio);
                const cicloDias = cultivo.plantaCultivada?.cicloMedioDias || 0;

                // Adiciona os dias do ciclo à data de plantio de forma segura
                dataPlantio.setDate(dataPlantio.getDate() + cicloDias);
                dataPrevista = dataPlantio;
            }

            // 4. Auditoria e Rastreabilidade (Logs do Sistema)
            const usuarioLogado = authService.obterUsuarioLogado();
            const idUser = usuarioLogado?.idUsuario || usuarioLogado?.id;

            await userService.registrarLog(
                "Análise Diagnóstica",
                `Acesso à telemetria avançada e histórico de colheita do lote #${cultivo.idCultivo} na área ${cultivo.areaCultivo?.nomeArea}`,
                idUser
            );

            // 5. Atualização de estados com higienização de dados
            setPerformanceArea(colheitaData);

            setDetalhesLote({
                totalAgua: aguaDTO?.totalVolumeLitros || 0,
                historicoPragas: Array.isArray(pragasVal) ? pragasVal : [],
                previsaoColheita: dataPrevista ? new Date(dataPrevista).toLocaleDateString('pt-BR') : 'Data Indefinida',
                compatibilidade: !!compatVal // Força conversão para booleano
            });

        } catch (err) {
            console.error("Erro na telemetria profunda:", err);
            notify("Falha ao sincronizar telemetria e dados de colheita.", "error");
        } finally {
            setLoading(false);
        }
    };

    const cultivosFiltrados = useMemo(() => {
        return cultivosTotal.filter(c => {
            const matchesArea = areaSelecionadaId === '' || c.areaCultivo?.idArea === parseInt(areaSelecionadaId);
            const matchesNome = c.plantaCultivada?.nomePopular?.toLowerCase().includes(filtroNome.toLowerCase());
            const matchesStatus = statusFiltro === 'TODOS' || c.statusCultivo === statusFiltro;
            return matchesArea && matchesNome && matchesStatus;
        });
    }, [cultivosTotal, areaSelecionadaId, filtroNome, statusFiltro]);

    const statsGerais = useMemo(() => {
        const ativos = cultivosTotal.filter(c => c.statusCultivo === 'ATIVO');
        return {
            totalAtivos: ativos.length,
            taxaSaude: ativos.length > 0 ? ((ativos.filter(c => c.estadoPlanta === 'SAUDAVEL').length / ativos.length) * 100).toFixed(1) : 0,
            alertas: ativos.filter(c => c.estadoPlanta === 'CRITICO' || c.estadoPlanta === 'PRAGA').length
        };
    }, [cultivosTotal]);

    const gerarPDF = async () => {
        // 1. Identificação do usuário para o Log de Auditoria
        const usuarioLogado = authService.obterUsuarioLogado();
        const idUsuario = usuarioLogado?.idUsuario || usuarioLogado?.id;

        try {
            // Inicializa o documento A4
            const doc = new jsPDF('p', 'mm', 'a4');

            // Definição Estrita de Cores (RGB)
            const rV = 18, gV = 98, bV = 11;    // Verde CultivaMais
            const rS = 71, gS = 85, bS = 105;   // Slate (Cinza Profissional)
            const rW = 255, gW = 255, bW = 255; // Branco

            // --- 1. CABEÇALHO CORPORATIVO ---
            doc.setFillColor(rV, gV, bV);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(rW, gW, rW);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("CultivaMais", 15, 22);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("SISTEMA DE INTELIGÊNCIA E MONITORAMENTO AGRÍCOLA", 15, 30);
            doc.text("RELATÓRIO TÉCNICO DE DESEMPENHO DE SAFRA", 15, 34);

            // Protocolo e Data (Canto Superior Direito)
            const timestamp = new Date().toLocaleString('pt-BR');
            doc.setFontSize(8);
            doc.text(`PROTOCOLO: CRM-${Date.now().toString().slice(-6)}`, 155, 15);
            doc.text(`EMISSÃO: ${timestamp}`, 155, 20);

            // --- 2. PAINEL DE KPIs (QUADRO DE RESUMO) ---
            doc.setFillColor(rW, gW, rW);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(15, 48, 180, 28, 2, 2, 'FD');

            // Labels
            doc.setFontSize(8);
            doc.setTextColor(rS, gS, bS);
            doc.setFont("helvetica", "bold");
            doc.text("SAÚDE DA SAFRA", 25, 56);
            doc.text("LOTES EM MONITORAMENTO", 85, 56);
            doc.text("ALERTAS DE RISCO", 145, 56);

            // Valores Dinâmicos
            doc.setFontSize(15);
            doc.setTextColor(rV, gV, bV);
            doc.text(`${statsGerais.taxaSaude}%`, 25, 66);

            doc.setTextColor(15, 23, 42); // Navy Blue
            doc.text(`${cultivosFiltrados.length} Unidades`, 85, 66);

            const hasAlerts = statsGerais.alertas > 0;
            doc.setTextColor(hasAlerts ? 185 : rV, hasAlerts ? 28 : gV, hasAlerts ? 28 : bV);
            doc.text(`${statsGerais.alertas} Críticos`, 145, 66);

            // --- 3. TABELA DE INVENTÁRIO DETALHADA ---
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Detalhamento por Lote e Estado Fitossanitário", 15, 90);

            autoTable(doc, {
                startY: 95,
                head: [['ID', 'CULTURA', 'ÁREA / SETOR', 'STATUS', 'SANIDADE']],
                body: cultivosFiltrados.map(c => [
                    { content: `#${c.idCultivo}`, styles: { fontStyle: 'bold' } },
                    c.plantaCultivada?.nomePopular?.toUpperCase() || 'N/A',
                    c.areaCultivo?.nomeArea || 'N/A',
                    c.statusCultivo?.replace('_', ' ') || 'N/A',
                    c.estadoPlanta || 'N/A'
                ]),
                theme: 'striped',
                headStyles: {
                    fillColor: [rV, gV, bV],
                    fontSize: 9,
                    halign: 'center',
                    cellPadding: 4
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    valign: 'middle',
                    font: 'helvetica'
                },
                columnStyles: {
                    0: { width: 15, halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const val = data.cell.raw;
                        if (val === 'CRITICO' || val === 'PRAGA') data.cell.styles.textColor = [185, 28, 28];
                        if (val === 'ALERTA' || val === 'EM_ATENCAO') data.cell.styles.textColor = [161, 98, 7];
                        if (val === 'SAUDAVEL') data.cell.styles.textColor = [21, 128, 61];
                    }
                }
            });

            // --- 4. ANÁLISE DE TELEMETRIA (SE SELECIONADO) ---
            let finalY = doc.lastAutoTable.finalY + 15;

            if (cultivoSelecionado) {
                // 1. Verificar quebra de página ANTES de começar a desenhar o bloco
                if (finalY > 220) {
                    doc.addPage();
                    finalY = 20;
                }

                // 2. Desenhar o fundo (Aumentei para 45mm para caber a nova linha de performance)
                doc.setFillColor(241, 245, 249);
                doc.roundedRect(15, finalY, 180, 45, 2, 2, 'F');

                // 3. Título do Diagnóstico
                doc.setFontSize(10);
                doc.setTextColor(rV, gV, bV);
                doc.setFont("helvetica", "bold");
                doc.text(`DIAGNÓSTICO PROFUNDO: ${cultivoSelecionado.plantaCultivada?.nomePopular}`, 22, finalY + 10);

                // 4. Detalhes Técnicos
                doc.setFontSize(8);
                doc.setTextColor(rS, gS, bS);
                doc.setFont("helvetica", "normal");

                doc.text(`• Acumulado Hídrico: ${detalhesLote.totalAgua} Litros aferidos`, 22, finalY + 18);
                doc.text(`• Janela de Colheita: Estimada para ${detalhesLote.previsaoColheita}`, 22, finalY + 24);
                doc.text(`• Índice de Solo: ${detalhesLote.compatibilidade ? 'COMPATÍVEL' : 'DIVERGENTE'}`, 22, finalY + 30);
                doc.text(`• Responsáveis: ${cultivoSelecionado.areaCultivo.usuariosResponsaveis?.length || 0} técnico(s) alocado(s)`, 22, finalY + 36);

                // 5. Histórico de Rendimento (Dentro do quadro, na última linha)
                if (performanceArea) {
                    doc.setFont("helvetica", "bold");
                    doc.text(`• Performance da Área: ${performanceArea.totalColhido || 0}kg colhidos historicamente`, 22, finalY + 42);
                }

                finalY += 55;
            }

            // --- 5. RODAPÉ TÉCNICO E PAGINAÇÃO ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(226, 232, 240);
                doc.line(15, 282, 195, 282);
                doc.setFontSize(7);
                doc.setTextColor(rS, gS, bS);
                doc.text("CultivaMais Platform - Software de Gestão Agrícola Enterprise", 15, 287);
                doc.text(`Página ${i} de ${pageCount}`, 195, 287, { align: 'right' });
            }

            // 2. REGISTRO DE LOG DE AUDITORIA (Ponto chave da correção)
            await userService.registrarLog(
                "Exportação de Dados",
                `Relatório PDF gerado com ${cultivosFiltrados.length} registros. Filtro status: ${statusFiltro}`,
                idUsuario
            );

            // Exportação e Feedback
            doc.save(`LAUDO_TECNICO_SAFRA_${Date.now()}.pdf`);
            notify("Relatório técnico gerado e registrado com sucesso.", "success");

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            notify("Falha crítica ao gerar documento técnico.", "error");
        }
    };

    return (
        <div className="main-content reports-page-wrapper">

            <header className="bi-header">
                <div>
                    <h1 className="main-title">Business Intelligence</h1>
                    <p className="sub-title">Monitoramento de Ativos e Sanidade Vegetal</p>
                </div>
                <div className="bi-action-group">
                    <select className="bi-select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                        <option value="TODOS">Todos os Status</option>
                        <option value="ATIVO">Ativos</option>
                        <option value="COLHIDO">Colhidos</option>
                        <option value="EM_PREPARO">Em Preparo</option>
                    </select>
                    <button className="bi-btn btn-sync" onClick={sincronizarBancoDeDados} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button className="bi-btn btn-export" onClick={gerarPDF}>
                        <FileSpreadsheet size={18} /> Exportar
                    </button>
                </div>
            </header>

            <nav className="bi-tabs">
                <button className={`bi-tab ${abaAtiva === 'geral' ? 'active' : ''}`} onClick={() => setAbaAtiva('geral')}>
                    <TrendingUp size={18} /> Dashboard Geral
                </button>
                <button className={`bi-tab ${abaAtiva === 'detalhado' ? 'active' : ''}`} onClick={() => setAbaAtiva('detalhado')}>
                    <Activity size={18} /> Análise Técnica
                </button>
            </nav>

            <section className="bi-content">
                {abaAtiva === 'geral' ? (
                    <div className="dashboard-grid animate-fade">
                        <div className="kpi-row-modern">
                            <div className="kpi-glass-card">
                                <div className="kpi-inner">
                                    <div className="kpi-icon orange"><AlertTriangle /></div>
                                    <div className="kpi-text"><p>Risco Imediato</p><h3>{statsGerais.alertas}</h3></div>
                                </div>
                            </div>
                            <div className="kpi-glass-card">
                                <div className="kpi-inner">
                                    <div className="kpi-icon green"><Leaf /></div>
                                    <div className="kpi-text"><p>Eficiência Bio</p><h3>{statsGerais.taxaSaude}%</h3></div>
                                </div>
                            </div>
                            <div className="kpi-glass-card">
                                <div className="kpi-inner">
                                    <div className="kpi-icon blue"><Zap /></div>
                                    <div className="kpi-text"><p>Em Produção</p><h3>{statsGerais.totalAtivos}</h3></div>
                                </div>
                            </div>
                        </div>

                        <div className="charts-row-complex">
                            <div className="chart-card-full">
                                <h3>Volume de Cultivo por Setor</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={areas.map(a => ({
                                        name: a.nomeArea,
                                        valor: cultivosTotal.filter(c => c.areaCultivo.idArea === a.idArea).length
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="valor" fill="#12620B" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card-side">
                                <h3>Saúde da Safra</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={distribuicaoSaude} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {distribuicaoSaude.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="precision-layout animate-fade">
                        <aside className="precision-sidebar">
                            <div className="search-box-premium">
                                <Search size={18} />
                                <input placeholder="Buscar lote ou planta..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
                            </div>
                            <div className="scroll-list-premium">
                                {cultivosFiltrados.map(c => (
                                    <button key={c.idCultivo} className={`lote-item ${cultivoSelecionado?.idCultivo === c.idCultivo ? 'active' : ''}`} onClick={() => analisarLoteDeep(c)}>
                                        <div className="lote-info">
                                            <span className="lote-name">{c.plantaCultivada?.nomePopular}</span>
                                            <span className="lote-sub">{c.areaCultivo?.nomeArea} • ID {c.idCultivo}</span>
                                        </div>
                                        <div className={`status-dot ${c.estadoPlanta}`}></div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <main className="precision-details">
                            {!cultivoSelecionado ? (
                                <div className="empty-state-bi">
                                    <ClipboardCheck size={48} />
                                    <p>Selecione um lote para auditoria completa</p>
                                </div>
                            ) : (
                                <div className="bi-detailed-view">
                                    <div className="predictive-banner">
                                        <div className="pred-item">
                                            <Calendar />
                                            <div><p>Colheita</p><strong>{detalhesLote.previsaoColheita}</strong></div>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="pred-item">
                                            <Target size={20} />
                                            <div><p>Match Agronômico</p><strong>{detalhesLote.compatibilidade ? "Ideal" : "Risco"}</strong></div>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="pred-item">
                                            <Users size={20} />
                                            <div><p>Responsáveis</p><strong>{cultivoSelecionado.areaCultivo.usuariosResponsaveis?.length || 0} Especialistas</strong></div>
                                        </div>
                                    </div>

                                    <div className="analysis-grid-complex">
                                        <div className="bi-card">
                                            <h3><Droplets size={18}/> Telemetria Hídrica</h3>
                                            <div className="big-value">{detalhesLote.totalAgua} <small>L/total</small></div>
                                            <div className="area-specs">
                                                <div className="spec-item"><span>Solo:</span> <strong>{cultivoSelecionado.areaCultivo.tipoSolo}</strong></div>
                                                <div className="spec-item"><span>Luz:</span> <strong>{cultivoSelecionado.areaCultivo.quantidadeLuz}</strong></div>
                                            </div>
                                        </div>

                                        <div className="bi-card">
                                            <h3><Bug size={18}/> Registros Fitossanitários</h3>
                                            <div className="timeline-bi">
                                                {detalhesLote.historicoPragas?.length === 0 ? (
                                                    <div className="success-message">Nenhuma ameaça biológica detectada.</div>
                                                ) : (
                                                    detalhesLote.historicoPragas?.map((p, idx) => (
                                                        <div key={idx} className="timeline-node">
                                                            <div className="node-marker"></div>
                                                            <div className="node-content">
                                                                <span className="node-date">{new Date(p.data).toLocaleDateString()}</span>
                                                                <p className="node-title">{p.nomePraga}</p>
                                                                <span className={`node-badge ${p.nivel}`}>{p.nivel}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="bi-card full-width">
                                            <h3><Users size={18}/> Equipe Responsável pela Área</h3>
                                            <div className="team-avatars">
                                                {cultivoSelecionado.areaCultivo.usuariosResponsaveis?.map((u, i) => (
                                                    <div key={i} className="user-tag">
                                                        <CheckCircle2 size={12} /> {u.nomeUsuario} ({u.funcao})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Relatorios;