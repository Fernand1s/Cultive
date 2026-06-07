-- DDL para inicialização de novo schema de tenant (H2 - desenvolvimento local)
-- Executado com SET SCHEMA <schema> ativo antes deste script.

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    codigo_recuperacao VARCHAR(255),
    funcao VARCHAR(50),
    foto_perfil CLOB
);

CREATE TABLE IF NOT EXISTS planta (
    id_planta BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome_popular VARCHAR(255),
    nome_cientifico VARCHAR(255),
    tipo_planta VARCHAR(50),
    ciclo_medio_dias INTEGER NOT NULL DEFAULT 0,
    descricao_planta VARCHAR(4096),
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
    id_area BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome_area VARCHAR(255),
    localizacao_area VARCHAR(255),
    latitude_area DOUBLE,
    longitude_area DOUBLE,
    tamanho_area DOUBLE,
    quantidade_luz VARCHAR(50),
    tipo_solo VARCHAR(50),
    observacao_area VARCHAR(4096)
);

CREATE TABLE IF NOT EXISTS area_usuario_responsavel (
    area_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (area_id, usuario_id),
    CONSTRAINT fk_aur_area FOREIGN KEY (area_id) REFERENCES area_cultivo(id_area) ON DELETE CASCADE,
    CONSTRAINT fk_aur_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cultivo (
    id_cultivo BIGINT AUTO_INCREMENT PRIMARY KEY,
    planta_id BIGINT,
    area_cultivo_id BIGINT,
    data_plantio DATE,
    previsao_colheita DATE,
    data_colheita_final DATE,
    estado_planta VARCHAR(50),
    status_cultivo VARCHAR(50),
    observacao_cultivo VARCHAR(4096),
    quantidade_plantada DOUBLE NOT NULL DEFAULT 0,
    quantidade_colhida DOUBLE NOT NULL DEFAULT 0,
    CONSTRAINT fk_cultivo_planta FOREIGN KEY (planta_id) REFERENCES planta(id_planta),
    CONSTRAINT fk_cultivo_area FOREIGN KEY (area_cultivo_id) REFERENCES area_cultivo(id_area)
);

-- SINGLE_TABLE inheritance: Irrigacao, DoencaPraga e Adubacao
CREATE TABLE IF NOT EXISTS evento (
    id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento VARCHAR(31) NOT NULL,
    cultivo_id BIGINT,
    data_hora TIMESTAMP,
    observacao_evento VARCHAR(4096),
    volume_agua DOUBLE,
    metodo VARCHAR(50),
    nome_praga_ou_doenca VARCHAR(255),
    nivel_afetacao VARCHAR(50),
    tipo_adubo VARCHAR(255),
    quantidade_adubo DOUBLE,
    CONSTRAINT fk_evento_cultivo FOREIGN KEY (cultivo_id) REFERENCES cultivo(id_cultivo)
);

CREATE TABLE IF NOT EXISTS tarefa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    descricao VARCHAR(4096),
    prioridade VARCHAR(50),
    categoria VARCHAR(255),
    data_prazo TIMESTAMP,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    cancelada BOOLEAN NOT NULL DEFAULT FALSE,
    observacao_conclusao VARCHAR(4096),
    data_criacao TIMESTAMP,
    data_conclusao TIMESTAMP,
    responsavel_id BIGINT,
    criador_id BIGINT,
    CONSTRAINT fk_tarefa_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_tarefa_criador FOREIGN KEY (criador_id) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS notificacao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    data_hora TIMESTAMP,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id BIGINT NOT NULL,
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255),
    acao VARCHAR(4096),
    data_hora TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estoque (
    id_estoque BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sku VARCHAR(255),
    categoria VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(100),
    marca VARCHAR(255),
    modelo VARCHAR(255),
    fornecedor VARCHAR(255),
    codigo_identificador VARCHAR(255),
    data_aquisicao VARCHAR(50),
    valor_compra DOUBLE,
    unidade_medida VARCHAR(50),
    localizacao VARCHAR(255),
    status VARCHAR(50),
    foto_preview CLOB,
    validade VARCHAR(50),
    principio_ativo CLOB,
    estoque_minimo BIGINT,
    quantidade_estoque BIGINT,
    horimetro_atual DOUBLE,
    horas_revisao VARCHAR(100),
    tipo_combustivel VARCHAR(50),
    placa VARCHAR(20),
    capacidade_trabalho VARCHAR(255),
    compatibilidade_potencia VARCHAR(255)
);
