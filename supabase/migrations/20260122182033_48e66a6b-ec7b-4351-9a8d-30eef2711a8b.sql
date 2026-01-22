-- Adicionar colunas para suportar autorizados como responsáveis nas neo_instalacoes
ALTER TABLE neo_instalacoes
ADD COLUMN IF NOT EXISTS tipo_responsavel TEXT DEFAULT 'equipe_interna',
ADD COLUMN IF NOT EXISTS autorizado_id UUID REFERENCES autorizados(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS autorizado_nome TEXT;

-- Adicionar colunas para suportar autorizados como responsáveis nas neo_correcoes
ALTER TABLE neo_correcoes
ADD COLUMN IF NOT EXISTS tipo_responsavel TEXT DEFAULT 'equipe_interna',
ADD COLUMN IF NOT EXISTS autorizado_id UUID REFERENCES autorizados(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS autorizado_nome TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_neo_instalacoes_autorizado_id ON neo_instalacoes(autorizado_id);
CREATE INDEX IF NOT EXISTS idx_neo_correcoes_autorizado_id ON neo_correcoes(autorizado_id);
CREATE INDEX IF NOT EXISTS idx_neo_instalacoes_tipo_responsavel ON neo_instalacoes(tipo_responsavel);
CREATE INDEX IF NOT EXISTS idx_neo_correcoes_tipo_responsavel ON neo_correcoes(tipo_responsavel);