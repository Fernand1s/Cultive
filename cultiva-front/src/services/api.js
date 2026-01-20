const API_ROOT = "http://localhost:8090/api";

// --- ENDPOINTS ---
const ENDPOINT_USUARIOS = `${API_ROOT}/usuarios`;
const ENDPOINT_LOGS = `${API_ROOT}/logs`;
const ENDPOINT_NOTIFICACOES = `${API_ROOT}/notificacoes`;
const ENDPOINT_PLANTAS = `${API_ROOT}/plantas`;

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// --- INTERCEPTOR DE REQUISIÇÃO (COM TOAST/ERROR TRIGGER) ---
export const request = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);

        // 401: Sessão Expirada
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario_logado');
            // O erro será pego pelo catch do componente e exibido no Toast
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }

        // 403: MENSAGEM PARA O MODAL/TOAST DE BLOQUEIO
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
        // Relança o erro para que o componente (Administracao.js) mostre o notify()
        throw error;
    }
};

// --- SERVIÇO DE AUTENTICAÇÃO ---
export const authService = {
    login: async (email, senha) => {
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

    registrarLog: async (acao, detalhes, usuarioId) => {
        try {
            await fetch(ENDPOINT_LOGS, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ acao, detalhes, usuarioId, dataHora: new Date().toISOString() })
            });
        } catch (e) { console.error("Erro no log:", e); }
    },

    criar: (formData) => request(ENDPOINT_USUARIOS, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            nomeUsuario: formData.nome || formData.nomeUsuario,
            email: formData.email,
            funcao: (formData.funcao || "OPERADOR_MAQUINAS").toUpperCase(),
            senha: "CultivaMais@2026",
            ativo: true
        })
    }),

    atualizar: (id, dados) => {
        const operador = authService.obterUsuarioLogado()?.nomeUsuario || "Sistema";
        return request(`${ENDPOINT_USUARIOS}/${id}?operador=${encodeURIComponent(operador)}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(dados)
        });
    },

    excluir: (id) => {
        const operador = authService.obterUsuarioLogado()?.nomeUsuario || "Sistema";
        return request(`${ENDPOINT_USUARIOS}/${id}?operador=${encodeURIComponent(operador)}`, {
            method: "DELETE",
            headers: getHeaders()
        });
    },

    gerarCodigo: (email) => request(`${ENDPOINT_USUARIOS}/gerar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    }),

    redefinirSenha: (email, codigo, novaSenha) => request(`${ENDPOINT_USUARIOS}/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha })
    })
};

// --- SERVIÇO DE NOTIFICAÇÕES ---
export const notificationService = {
    // Busca as notificações do usuário logado
    listar: () => {
        const user = authService.obterUsuarioLogado();
        const id = user?.idUsuario || user?.id; // Tenta capturar o ID de ambos os formatos
        return id ? request(`${ENDPOINT_NOTIFICACOES}/usuario/${id}`, { headers: getHeaders() }) : [];
    },

    // Marca uma notificação individual como LIDA
    marcarComoLida: (id) =>
        request(`${ENDPOINT_NOTIFICACOES}/${id}/lida`, { method: "PATCH", headers: getHeaders() }),

    // Marca uma notificação individual como NÃO LIDA (Novo!)
    marcarComoNaoLida: (id) =>
        request(`${ENDPOINT_NOTIFICACOES}/${id}/nao-lida`, { method: "PATCH", headers: getHeaders() }),

    // Marca todas do usuário como LIDAS
    marcarTodasComoLidas: (idUsuario) =>
        request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}/ler-todas`, { method: "PUT", headers: getHeaders() }),

    // Marca todas do usuário como NÃO LIDAS (Novo!)
    marcarTodasComoNaoLidas: (idUsuario) =>
        request(`${ENDPOINT_NOTIFICACOES}/usuario/${idUsuario}/desler-todas`, { method: "PUT", headers: getHeaders() }),

    // Exclui uma notificação
    excluir: (id) =>
        request(`${ENDPOINT_NOTIFICACOES}/${id}`, { method: "DELETE", headers: getHeaders() })
};

// --- SERVIÇO DE PLANTAS ---
export const plantaService = {
    listar: () => request(ENDPOINT_PLANTAS, { headers: getHeaders() }),
    criar: (dados) => request(ENDPOINT_PLANTAS, { method: "POST", headers: getHeaders(), body: JSON.stringify(dados) }),
    excluir: (id) => request(`${ENDPOINT_PLANTAS}/${id}`, { method: "DELETE", headers: getHeaders() }),
    atualizar: (id, dados) => request(`${ENDPOINT_PLANTAS}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(dados) })
};