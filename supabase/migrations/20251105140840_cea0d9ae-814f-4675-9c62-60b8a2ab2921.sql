-- Adicionar coluna capturada_em em todas as tabelas de ordens
ALTER TABLE ordens_soldagem ADD COLUMN IF NOT EXISTS capturada_em timestamp with time zone;
ALTER TABLE ordens_perfiladeira ADD COLUMN IF NOT EXISTS capturada_em timestamp with time zone;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS capturada_em timestamp with time zone;
ALTER TABLE ordens_qualidade ADD COLUMN IF NOT EXISTS capturada_em timestamp with time zone;
ALTER TABLE ordens_pintura ADD COLUMN IF NOT EXISTS capturada_em timestamp with time zone;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_soldagem_capturada_em ON ordens_soldagem(capturada_em);
CREATE INDEX IF NOT EXISTS idx_ordens_perfiladeira_capturada_em ON ordens_perfiladeira(capturada_em);
CREATE INDEX IF NOT EXISTS idx_ordens_separacao_capturada_em ON ordens_separacao(capturada_em);
CREATE INDEX IF NOT EXISTS idx_ordens_qualidade_capturada_em ON ordens_qualidade(capturada_em);
CREATE INDEX IF NOT EXISTS idx_ordens_pintura_capturada_em ON ordens_pintura(capturada_em);

-- Comentários
COMMENT ON COLUMN ordens_soldagem.capturada_em IS 'Timestamp de quando a ordem foi capturada pelo responsável';
COMMENT ON COLUMN ordens_perfiladeira.capturada_em IS 'Timestamp de quando a ordem foi capturada pelo responsável';
COMMENT ON COLUMN ordens_separacao.capturada_em IS 'Timestamp de quando a ordem foi capturada pelo responsável';
COMMENT ON COLUMN ordens_qualidade.capturada_em IS 'Timestamp de quando a ordem foi capturada pelo responsável';
COMMENT ON COLUMN ordens_pintura.capturada_em IS 'Timestamp de quando a ordem foi capturada pelo responsável';