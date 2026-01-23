-- Adicionar campos para faturamento de instalação na tabela vendas
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS lucro_instalacao NUMERIC DEFAULT NULL;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS custo_instalacao NUMERIC DEFAULT NULL;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS instalacao_faturada BOOLEAN DEFAULT FALSE;