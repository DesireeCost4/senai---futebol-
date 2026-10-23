-- Script para Popular Banco de Dados para Testes (mock.sql)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE duelos_partida;
TRUNCATE TABLE partidas;
TRUNCATE TABLE escalacoes;
TRUNCATE TABLE transacoes;
TRUNCATE TABLE contratos;
TRUNCATE TABLE jogadores;
TRUNCATE TABLE clubes;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. INSERIR CLUBES
-- ==========================================
INSERT INTO clubes (id, nome, sigla, caixa, formacao) VALUES (1, 'Sport Club do Recife', 'SPT', 5000.00, '3-1');
INSERT INTO clubes (id, nome, sigla, caixa, formacao) VALUES (2, 'Clube Náutico Capibaribe', 'NAU', 5000.00, '3-1');
INSERT INTO clubes (id, nome, sigla, caixa, formacao) VALUES (3, 'Santa Cruz Futebol Clube', 'STC', 5000.00, '3-1');

-- ==========================================
-- 2. INSERIR JOGADORES
-- ==========================================

-- Elenco do Sport (Clube ID 1) - 1 GOL, 3 ZAG, 1 ATA
INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (1, 'Goleiro Sport', 'GOL', 70, 25, 500.00, 'APTO', 1, 65, 30, 60, 40, 85, 75, 85);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (2, 'Zagueiro Sport 1', 'ZAG', 68, 26, 400.00, 'APTO', 1, 70, 40, 65, 50, 82, 80, 82);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (3, 'Zagueiro Sport 2', 'ZAG', 65, 27, 400.00, 'APTO', 1, 68, 38, 62, 48, 80, 82, 82);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (4, 'Zagueiro Sport 3', 'ZAG', 75, 24, 450.00, 'APTO', 1, 78, 50, 70, 65, 75, 76, 82);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (5, 'Atacante Sport', 'ATA', 80, 22, 800.00, 'APTO', 1, 85, 85, 72, 80, 40, 75, 88);


-- Elenco do Náutico (Clube ID 2) - 1 GOL, 3 ZAG, 1 ATA
INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (6, 'Goleiro Náutico', 'GOL', 72, 28, 500.00, 'APTO', 2, 66, 32, 58, 42, 83, 74, 83);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (7, 'Zagueiro Náutico 1', 'ZAG', 67, 25, 400.00, 'APTO', 2, 69, 42, 63, 52, 79, 81, 81);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (8, 'Zagueiro Náutico 2', 'ZAG', 66, 29, 400.00, 'APTO', 2, 67, 39, 60, 49, 78, 83, 83);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (9, 'Zagueiro Náutico 3', 'ZAG', 74, 23, 450.00, 'APTO', 2, 76, 48, 68, 63, 74, 78, 84);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (10, 'Atacante Náutico', 'ATA', 82, 24, 800.00, 'APTO', 2, 86, 83, 74, 82, 42, 77, 86);


-- Elenco do Santa Cruz (Clube ID 3)
INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (11, 'Goleiro Santa', 'GOL', 69, 26, 450.00, 'APTO', 3, 64, 31, 57, 41, 81, 72, 81);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (12, 'Zagueiro Santa', 'ZAG', 65, 27, 380.00, 'APTO', 3, 66, 37, 59, 47, 77, 79, 79);

INSERT INTO jogadores (id, nome, posicao, agilidade, idade, valor_base, condicao, clube_id, velocidade, finalizacao, passe, drible, defesa, fisico, potencial)
VALUES (13, 'Atacante Santa', 'ATA', 78, 23, 750.00, 'APTO', 3, 83, 80, 68, 77, 38, 73, 83);


-- ==========================================
-- 3. INSERIR CONTRATOS (Para passar na validação de LigaService)
-- ==========================================
-- Atribuindo contratos ATIVOS para todos os jogadores nos seus respectivos clubes atuais
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (1, 1, 1, 500.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (2, 2, 1, 400.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (3, 3, 1, 400.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (4, 4, 1, 450.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (5, 5, 1, 800.00, '2030-12-31 23:59:59', 'ATIVO');

INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (6, 6, 2, 500.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (7, 7, 2, 400.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (8, 8, 2, 400.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (9, 9, 2, 450.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (10, 10, 2, 800.00, '2030-12-31 23:59:59', 'ATIVO');

INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (11, 11, 3, 450.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (12, 12, 3, 380.00, '2030-12-31 23:59:59', 'ATIVO');
INSERT INTO contratos (id, jogador_id, clube_id, valor_compra, fidelidade_ate, situacao) VALUES (13, 13, 3, 750.00, '2030-12-31 23:59:59', 'ATIVO');

-- ==========================================
-- 4. INSERIR ESCALAÇÕES INICIAIS (Formação '3-1': 1 GOL + 3 ZAG + 1 ATA já escalados)
-- ==========================================
-- Escalados do Sport
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (1, 1);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (1, 2);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (1, 3);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (1, 4);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (1, 5);

-- Escalados do Náutico
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (2, 6);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (2, 7);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (2, 8);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (2, 9);
INSERT INTO escalacoes (clube_id, jogador_id) VALUES (2, 10);