-- Corrigir ordens com carregamento_concluido = true mas status inconsistente
UPDATE ordens_carregamento 
SET status = 'concluida', updated_at = now()
WHERE carregamento_concluido = true 
  AND status != 'concluida';