const API_ROOT = "http://localhost:8090/api";
const ENDPOINT_ESTOQUE = `${API_ROOT}/estoque`;

// --- ENDPOINTS ---
const ENDPOINT_USUARIOS = `${API_ROOT}/usuarios`;
const ENDPOINT_LOGS = `${API_ROOT}/logs`;
const ENDPOINT_NOTIFICACOES = `${API_ROOT}/notificacoes`;
const ENDPOINT_PLANTAS = `${API_ROOT}/plantas`;
const ENDPOINT_TAREFAS = `${API_ROOT}/tarefas`;
const ENDPOINT_AREAS = `${API_ROOT}/areas`;
const ENDPOINT_CULTIVOS = `${API_ROOT}/cultivos`;
const ENDPOINT_EVENTOS = `${API_ROOT}/eventos`;
const ENDPOINT_RELATORIOS = `${API_ROOT}/relatorios`;

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// --- INTERCEPTOR DE REQUISIÇÃO CENTRALIZADO ---
export const request = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario_logado');
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }

        if (response.status === 403) {
            throw new Error("Acesso Negado: Você não tem permissão para realizar esta ação.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro na comunicação com o servidor.");
        }

        if (response.status === 204) return true;
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// --- SERVIÇO DE AUTENTICAÇÃO ---
export const authService = {
    login: async (email, senha) => {
        // Usando fetch direto aqui para tratar erro de credenciais antes do interceptor
        const response = await fetch(`${ENDPOINT_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }),
        });

        if (response.status === 401) throw new Error("E-mail ou senha incorretos.");
        if (!response.ok) throw new Error("Erro ao conectar com o servidor.");

        const dados = await response.json();
        if (dados.token) localStorage.setItem('token', dados.token);
        if (dados.idUsuario) localStorage.setItem('usuario_logado', JSON.stringify(dados));

        return dados;
    },
    usuarioEstaLogado: () => !!localStorage.getItem('token'),
    obterUsuarioLogado: () => JSON.parse(localStorage.getItem('usuario_logado')),
    logout: () => {
        localStorage.clear();
        window.location.href = "/login";
    }
};

// --- SERVIÇO DE USUÁRIOS E LOGS ---
export const userService = {
    listar: () => request(ENDPOINT_USUARIOS, { headers: getHeaders() }),
    obterPorId: (id) => request(`${ENDPOINT_USUARIOS}/${id}`, { headers: getHeaders() }),
    listarLogs: () => request(ENDPOINT_LOGS, { headers: getHeaders() }),
    registrarLog: (acao, detalhes, usuarioId) => {
        return request(ENDPOINT_LOGS, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                acao,
                detalhes,
                usuarioId,
                dataHora: new Date().toISOString()
            })
        }).catch(e => {
            console.error("Falha ao registrar log de auditoria:", e);
        });
    },
    criar: (formData) => request(ENDPOINT_USUARIOS, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ ...formData, senha: formData.senha || "CultivaMais@2026", ativo: true })
    }),
    atualizar: (id, dados) => request(`${ENDPOINT_USUARIOS}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_USUARIOS}/${id}`, { method: "DELETE", headers: getHeaders() }),
    gerarCodigo: (email) => request(`${ENDPOINT_USUARIOS}/gerar-codigo`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email }) }),
    redefinirSenha: (dados) => request(`${ENDPOINT_USUARIOS}/redefinir-senha`, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    logoutGlobal: () => request(`${ENDPOINT_USUARIOS}/logout-global`, { method: "POST", headers: getHeaders() })
};

// --- SERVIÇO DE TAREFAS ---
export const tarefaService = {
    listar: (idUsuario, funcao) => {
        let url = ENDPOINT_TAREFAS;
        const params = new URLSearchParams();
        if (idUsuario) params.append('idUsuario', idUsuario);
        if (funcao) params.append('funcao', funcao);
        if (params.toString()) url += `?${params.toString()}`;
        return request(url, { headers: getHeaders() });
    },
    criar: (dados, idCriador, idResponsavel) =>
        request(`${ENDPOINT_TAREFAS}?idCriador=${idCriador}&idResponsavel=${idResponsavel}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(dados)
        }),

    atualizar: (id, idUsuarioLogado, dados) => request(`${ENDPOINT_TAREFAS}/${id}?idUsuarioLogado=${idUsuarioLogado}`, {method: "PUT", headers: getHeaders(), body: JSON.stringify(dados)}),
    concluir: (id, idUsuarioLogado, dados) => request(`${ENDPOINT_TAREFAS}/${id}/concluir?idUsuarioLogado=${idUsuarioLogado}`, { method: "PATCH",  headers: getHeaders(),  body: JSON.stringify(dados) }),
    atualizarObservacao: (id, idUsuarioLogado, dados) => request(`${ENDPOINT_TAREFAS}/${id}/atualizar-observacao?idUsuarioLogado=${idUsuarioLogado}`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(dados) }),
    cancelar: (id, idUsuarioLogado) => request(`${ENDPOINT_TAREFAS}/${id}/cancelar?idUsuarioLogado=${idUsuarioLogado}`, {method: "PUT", headers: getHeaders() }),
    excluir: (id, idUsuarioLogado) => request(`${ENDPOINT_TAREFAS}/${id}?idUsuarioLogado=${idUsuarioLogado}`, {method: "DELETE", headers: getHeaders() }),
};

// --- SERVIÇO DE PLANTAS ---
export const plantaService = {
    listar: () => request(ENDPOINT_PLANTAS, { headers: getHeaders() }),
    criar: (dados) => request(ENDPOINT_PLANTAS, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    atualizar: (id, dados) => request(`${ENDPOINT_PLANTAS}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_PLANTAS}/${id}`, { method: "DELETE", headers: getHeaders() })
};

// --- SERVIÇO DE NOTIFICAÇÕES ---
export const notificationService = {
    listar: (idUsuario) => request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}`, { headers: getHeaders() }),
    contarNaoLidas: (idUsuario) => request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}/contar-nao-lidas`, { headers: getHeaders() }),
    marcarLida: (id) => request(`${ENDPOINT_NOTIFICACOES}/${id}/lida`, { method: "PATCH", headers: getHeaders() }),
    marcarNaoLida: (id) => request(`${ENDPOINT_NOTIFICACOES}/${id}/nao-lida`, { method: "PATCH", headers: getHeaders() }),
    marcarTodasLidas: (idUsuario) => request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}/ler-todas`, { method: "PUT", headers: getHeaders() }),
    marcarTodasNaoLidas: (idUsuario) => request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}/desler-todas`, { method: "PUT", headers: getHeaders() }),
    excluir: (id) => request(`${ENDPOINT_NOTIFICACOES}/${id}`, { method: "DELETE", headers: getHeaders() })
};

// --- SERVIÇO DE ÁREAS ---
export const areaService = {
    listar: () => request(ENDPOINT_AREAS, { headers: getHeaders() }),
    criar: (dados) => request(ENDPOINT_AREAS, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    atualizar: (id, dados) => request(`${ENDPOINT_AREAS}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_AREAS}/${id}`, { method: "DELETE", headers: getHeaders() }),
    obterClima: (id) => request(`${ENDPOINT_AREAS}/${id}/clima`, { headers: getHeaders() })
};

// --- SERVIÇO DE CULTIVOS ---
export const cultivoService = {
    listar: () => request(ENDPOINT_CULTIVOS, { headers: getHeaders() }),
    criar: (dados) => request(ENDPOINT_CULTIVOS, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    atualizar: (id, dados) => request(`${ENDPOINT_CULTIVOS}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_CULTIVOS}/${id}`, { method: "DELETE", headers: getHeaders() }),
    registrarColheita: (id, dados) => request(`${ENDPOINT_CULTIVOS}/${id}/colheita`, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    listarColheitas: (id) => request(`${ENDPOINT_CULTIVOS}/${id}/colheitas`, { headers: getHeaders() }),
    encerrar: (id, dados) => request(`${ENDPOINT_CULTIVOS}/${id}/encerrar`, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
};

// --- SERVIÇO DE EVENTOS (IRRIGAÇÃO E PRAGAS) ---
export const eventoService = {
    irrigacao: {
        listarPorCultivo: (idCultivo) => request(`${ENDPOINT_EVENTOS}/irrigacao/cultivo/${idCultivo}`, { headers: getHeaders() }),
        registrar: (idCultivo, dados) => request(`${ENDPOINT_EVENTOS}/irrigacao/${idCultivo}`, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
        atualizar: (idEvento, dados) => request(`${ENDPOINT_EVENTOS}/irrigacao/${idEvento}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
        excluir: (idEvento) => request(`${ENDPOINT_EVENTOS}/irrigacao/${idEvento}`, { method: "DELETE", headers: getHeaders() })
    },
    praga: {
        listarPorCultivo: (idCultivo) => request(`${ENDPOINT_EVENTOS}/praga/cultivo/${idCultivo}`, { headers: getHeaders() }),
        registrar: (idCultivo, dados) => request(`${ENDPOINT_EVENTOS}/praga/${idCultivo}`, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
        atualizar: (idEvento, dados) => request(`${ENDPOINT_EVENTOS}/praga/${idEvento}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
        excluir: (idEvento) => request(`${ENDPOINT_EVENTOS}/praga/${idEvento}`, { method: "DELETE", headers: getHeaders() })
    }
};

// --- SERVIÇO DE ESTOQUE ---
export const estoqueService = {
    listar: () => request(ENDPOINT_ESTOQUE, { headers: getHeaders() }),
    criar: (dados) => request(ENDPOINT_ESTOQUE, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    atualizar: (id, dados) => request(`${ENDPOINT_ESTOQUE}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_ESTOQUE}/${id}`, { method: "DELETE", headers: getHeaders() })
};

// --- SERVIÇO DE RELATÓRIOS ---
export const relatorioService = {
    // Produção e Safra
    produtividade: (idArea) => {
        const url = idArea ? `${ENDPOINT_RELATORIOS}/produtividade?idArea=${idArea}` : `${ENDPOINT_RELATORIOS}/produtividade`;
        return request(url, { headers: getHeaders() });
    },
    cadernoCampo: (idCultivo) => request(`${ENDPOINT_RELATORIOS}/caderno-campo/${idCultivo}`, { headers: getHeaders() }),

    // Fitossanitário
    incidenciaPragas: (idArea, idPlanta) => {
        const params = new URLSearchParams();
        if (idArea) params.append('idArea', idArea);
        if (idPlanta) params.append('idPlanta', idPlanta);
        const query = params.toString() ? `?${params.toString()}` : '';
        return request(`${ENDPOINT_RELATORIOS}/incidencia-pragas${query}`, { headers: getHeaders() });
    },

    // Estoque e Consumo
    alertasEstoque: () => request(`${ENDPOINT_RELATORIOS}/alertas-estoque`, { headers: getHeaders() }),

    // Ocupação e Solo
    rotacaoCulturas: (idArea) => {
        const url = idArea ? `${ENDPOINT_RELATORIOS}/rotacao-culturas?idArea=${idArea}` : `${ENDPOINT_RELATORIOS}/rotacao-culturas`;
        return request(url, { headers: getHeaders() });
    },
    ocupacaoAreas: () => request(`${ENDPOINT_RELATORIOS}/ocupacao-areas`, { headers: getHeaders() }),

    // Equipe e Operações
    desempenhoEquipe: () => request(`${ENDPOINT_RELATORIOS}/desempenho-equipe`, { headers: getHeaders() }),
};