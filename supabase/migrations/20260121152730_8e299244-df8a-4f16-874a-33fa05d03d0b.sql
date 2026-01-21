-- Adicionar colunas para controle de problemas por linha
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS com_problema boolean DEFAULT false;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS problema_descricao text;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS problema_reportado_em timestamp with time zone;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS problema_reportado_por uuid REFERENCES auth.users(id);

-- Criar índice para busca rápida de linhas com problema
CREATE INDEX IF NOT EXISTS idx_linhas_ordens_com_problema ON linhas_ordens(pedido_id, com_problema) WHERE com_problema = true;

-- Corrigir dados do pedido 0118 (329c5787-da9e-4a81-9d1d-3f7699081330)
-- Marcar todas as linhas de separação como concluídas
UPDATE linhas_ordens
SET concluida = true, updated_at = NOW()
WHERE pedido_id = '329c5787-da9e-4a81-9d1d-3f7699081330'
  AND tipo_ordem = 'separacao'
  AND concluida = false;