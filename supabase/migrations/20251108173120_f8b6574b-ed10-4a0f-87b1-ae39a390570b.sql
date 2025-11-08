-- Adicionar coluna historico nas tabelas de ordens de produção
ALTER TABLE ordens_soldagem ADD COLUMN IF NOT EXISTS historico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ordens_perfiladeira ADD COLUMN IF NOT EXISTS historico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS historico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ordens_qualidade ADD COLUMN IF NOT EXISTS historico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ordens_pintura ADD COLUMN IF NOT EXISTS historico BOOLEAN NOT NULL DEFAULT false;

-- Criar índices para melhor performance nas queries de histórico
CREATE INDEX IF NOT EXISTS idx_ordens_soldagem_historico ON ordens_soldagem(historico);
CREATE INDEX IF NOT EXISTS idx_ordens_perfiladeira_historico ON ordens_perfiladeira(historico);
CREATE INDEX IF NOT EXISTS idx_ordens_separacao_historico ON ordens_separacao(historico);
CREATE INDEX IF NOT EXISTS idx_ordens_qualidade_historico ON ordens_qualidade(historico);
CREATE INDEX IF NOT EXISTS idx_ordens_pintura_historico ON ordens_pintura(historico);