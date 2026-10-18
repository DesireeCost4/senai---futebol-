SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS duelos_partida;
DROP TABLE IF EXISTS partidas;
DROP TABLE IF EXISTS escalacoes;
DROP TABLE IF EXISTS transacoes;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS jogadores;
DROP TABLE IF EXISTS clubes;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE clubes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE,
    sigla CHAR(3) NOT NULL UNIQUE,
    caixa DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    formacao VARCHAR(5),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jogadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    posicao VARCHAR(3) NOT NULL,
    agilidade INT NOT NULL,
    idade INT NOT NULL,
    valor_base DECIMAL(6,2) NOT NULL,
    condicao VARCHAR(20) NOT NULL DEFAULT 'APTO',
    clube_id INT,
    velocidade INT NOT NULL,
    finalizacao INT NOT NULL,
    passe INT NOT NULL,
    drible INT NOT NULL,
    defesa INT NOT NULL,
    fisico INT NOT NULL,
    potencial INT NOT NULL,
    excluido_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clube_id) REFERENCES clubes(id)
);

CREATE TABLE contratos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jogador_id INT NOT NULL,
    clube_id INT NOT NULL,
    valor_compra DECIMAL(6,2) NOT NULL,
    fidelidade_ate TIMESTAMP NOT NULL,
    situacao VARCHAR(12) NOT NULL DEFAULT 'ATIVO',
    iniciado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em TIMESTAMP NULL,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id),
    FOREIGN KEY (clube_id) REFERENCES clubes(id)
);

CREATE TABLE transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    jogador_id INT NOT NULL,
    nome_jogador VARCHAR(100) NOT NULL,
    tipo VARCHAR(6) NOT NULL,
    valor DECIMAL(6,2) NOT NULL,
    taxa DECIMAL(6,2) NOT NULL,
    multa DECIMAL(6,2) NOT NULL,
    lucro DECIMAL(7,2) NULL,
    variacao_caixa DECIMAL(8,2) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clube_id) REFERENCES clubes(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);

CREATE TABLE escalacoes (
        clube_id INT NOT NULL,
        jogador_id INT NOT NULL UNIQUE,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (clube_id, jogador_id),
        FOREIGN KEY (clube_id) REFERENCES clubes(id),
        FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);

CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mandante_id INT NOT NULL,
    visitante_id INT NOT NULL,
    gols_mandante INT NOT NULL,
    gols_visitante INT NOT NULL,
    formacao_mandante VARCHAR(5) NOT NULL,
    formacao_visitante VARCHAR(5) NOT NULL,
    jogada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mandante_id) REFERENCES clubes(id),
    FOREIGN KEY (visitante_id) REFERENCES clubes(id)
);

CREATE TABLE duelos_partida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    ordem INT NOT NULL,
    clube_atacante_id INT NOT NULL,
    atacante_id INT NOT NULL,
    defensor_id INT NOT NULL,
    nome_atacante VARCHAR(100) NOT NULL,
    nome_defensor VARCHAR(100) NOT NULL,
    posicao_atacante VARCHAR(3) NOT NULL,
    posicao_defensor VARCHAR(3) NOT NULL,
    condicao_atacante VARCHAR(20) NOT NULL,
    condicao_defensor VARCHAR(20) NOT NULL,
    atributo_ataque VARCHAR(10) NOT NULL,
    atributo_defesa VARCHAR(10) NOT NULL,
    valor_ataque INT NOT NULL,
    valor_defesa INT NOT NULL,
    gol BOOLEAN NOT NULL,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (clube_atacante_id) REFERENCES clubes(id),
    FOREIGN KEY (atacante_id) REFERENCES jogadores(id),
    FOREIGN KEY (defensor_id) REFERENCES jogadores(id)
);
