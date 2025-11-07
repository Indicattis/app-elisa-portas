-- Renomear valor do enum setor_producao de 'solda' para 'soldagem'
-- Isso garante consistência com o nome da tabela 'ordens_soldagem' e com o código
ALTER TYPE setor_producao RENAME VALUE 'solda' TO 'soldagem';

COMMENT ON TYPE setor_producao IS 'Setores responsáveis pela produção dos produtos - valores: perfiladeira, soldagem, separacao, pintura';