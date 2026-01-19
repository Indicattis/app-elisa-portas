-- Excluir tabelas obsoletas

-- 1. Remover tabela ordens_producao (legada, substituída por tabelas específicas)
DROP TABLE IF EXISTS ordens_producao CASCADE;

-- 2. Remover tabelas do organograma (funcionalidade desativada)
DROP TABLE IF EXISTS organograma_connections CASCADE;
DROP TABLE IF EXISTS organograma_positions CASCADE;

-- 3. Remover tabela pontos_instalacao (não utilizada)
DROP TABLE IF EXISTS pontos_instalacao CASCADE;