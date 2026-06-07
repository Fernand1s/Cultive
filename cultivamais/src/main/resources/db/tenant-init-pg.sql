-- DDL para inicialização de novo schema de tenant (PostgreSQL / Supabase)
-- Executado com SET search_path TO <schema> ativo antes deste script.

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    nome_usuario VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    codigo_recuperacao VARCHAR(255),
    funcao VARCHAR(50),
    foto_perfil TEXT
);

CREATE TABLE IF NOT EXISTS planta (
    id_planta BIGSERIAL PRIMARY KEY,
    nome_popular VARCHAR(255),
    nome_cientifico VARCHAR(255),
    tipo_planta VARCHAR(50),
    ciclo_medio_dias INTEGER NOT NULL DEFAULT 0,
    descricao_planta TEXT,
    excluido BOOLEAN NOT NULL DEFAULT FALSE,
    luz_recomendada VARCHAR(50),
    agua_recomendada VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS planta_solos_recomendados (
    planta_id BIGINT NOT NULL,
    tipo_solo VARCHAR(50),
    CONSTRAINT fk_psr_planta FOREIGN KEY (planta_id) REFERENCES planta(id_planta) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS area_cultivo (
    id_area BIGSERIAL PRIMARY KEY,
    nome_area VARCHAR(255),
    localizacao_area VARCHAR(255),
    latitude_area DOUBLE PRECISION,
    longitude_area DOUBLE PRECISION,
    tamanho_area DOUBLE PRECISION,
    quantidade_luz VARCHAR(50),
    tipo_solo VARCHAR(50),
    observacao_area TEXT
);

CREATE TABLE IF NOT EXISTS area_usuario_responsavel (
    area_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (area_id, usuario_id),
    CONSTRAINT fk_aur_area FOREIGN KEY (area_id) REFERENCES area_cultivo(id_area) ON DELETE CASCADE,
    CONSTRAINT fk_aur_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cultivo (
    id_cultivo BIGSERIAL PRIMARY KEY,
    planta_id BIGINT,
    area_cultivo_id BIGINT,
    data_plantio DATE,
    previsao_colheita DATE,
    data_colheita_final DATE,
    estado_planta VARCHAR(50),
    status_cultivo VARCHAR(50),
    observacao_cultivo TEXT,
    quantidade_plantada DOUBLE PRECISION NOT NULL DEFAULT 0,
    quantidade_colhida DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT fk_cultivo_planta FOREIGN KEY (planta_id) REFERENCES planta(id_planta),
    CONSTRAINT fk_cultivo_area FOREIGN KEY (area_cultivo_id) REFERENCES area_cultivo(id_area)
);

-- SINGLE_TABLE inheritance: Irrigacao, DoencaPraga e Adubacao compartilham esta tabela
CREATE TABLE IF NOT EXISTS evento (
    id_evento BIGSERIAL PRIMARY KEY,
    tipo_evento VARCHAR(31) NOT NULL,
    cultivo_id BIGINT,
    data_hora TIMESTAMP,
    observacao_evento TEXT,
    -- Irrigacao
    volume_agua DOUBLE PRECISION,
    metodo VARCHAR(50),
    -- DoencaPraga
    nome_praga_ou_doenca VARCHAR(255),
    nivel_afetacao VARCHAR(50),
    -- Adubacao
    tipo_adubo VARCHAR(255),
    quantidade_adubo DOUBLE PRECISION,
    CONSTRAINT fk_evento_cultivo FOREIGN KEY (cultivo_id) REFERENCES cultivo(id_cultivo)
);

CREATE TABLE IF NOT EXISTS tarefa (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    descricao TEXT,
    prioridade VARCHAR(50),
    categoria VARCHAR(255),
    subcategoria VARCHAR(255),
    informacoes_extras TEXT,
    data_prazo TIMESTAMP,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    cancelada BOOLEAN NOT NULL DEFAULT FALSE,
    em_observacao BOOLEAN NOT NULL DEFAULT FALSE,
    observacao_conclusao TEXT,
    foto_conclusao TEXT,
    insumos_usados_json TEXT,
    data_criacao TIMESTAMP,
    data_conclusao TIMESTAMP,
    responsavel_id BIGINT,
    criador_id BIGINT,
    area_cultivo_id BIGINT,
    cultivo_id BIGINT,
    CONSTRAINT fk_tarefa_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_tarefa_criador FOREIGN KEY (criador_id) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_tarefa_area FOREIGN KEY (area_cultivo_id) REFERENCES area_cultivo(id_area),
    CONSTRAINT fk_tarefa_cultivo FOREIGN KEY (cultivo_id) REFERENCES cultivo(id_cultivo)
);

CREATE TABLE IF NOT EXISTS notificacao (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    data_hora TIMESTAMP,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id BIGINT NOT NULL,
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario VARCHAR(255),
    acao TEXT,
    data_hora TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estoque (
    id_estoque BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sku VARCHAR(255),
    categoria VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(100),
    marca VARCHAR(255),
    modelo VARCHAR(255),
    fornecedor VARCHAR(255),
    codigo_identificador VARCHAR(255),
    data_aquisicao VARCHAR(50),
    valor_compra DOUBLE PRECISION,
    unidade_medida VARCHAR(50),
    localizacao VARCHAR(255),
    status VARCHAR(50),
    foto_preview TEXT,
    -- Insumos
    validade VARCHAR(50),
    principio_ativo TEXT,
    estoque_minimo BIGINT,
    quantidade_estoque BIGINT,
    -- Maquinários
    horimetro_atual DOUBLE PRECISION,
    horas_revisao VARCHAR(100),
    tipo_combustivel VARCHAR(50),
    placa VARCHAR(20),
    -- Equipamentos
    capacidade_trabalho VARCHAR(255),
    compatibilidade_potencia VARCHAR(255)
);
