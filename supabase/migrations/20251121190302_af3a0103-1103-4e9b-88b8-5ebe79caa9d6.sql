-- Adicionar coluna notas à tabela chamados_suporte
ALTER TABLE chamados_suporte 
  ADD COLUMN IF NOT EXISTS notas text;

-- Migrar status existentes de 'aberto' para 'pendente'
UPDATE chamados_suporte 
  SET status = 'pendente' 
  WHERE status = 'aberto';

-- Atualizar valor padrão do status para 'pendente'
ALTER TABLE chamados_suporte 
  ALTER COLUMN status SET DEFAULT 'pendente';