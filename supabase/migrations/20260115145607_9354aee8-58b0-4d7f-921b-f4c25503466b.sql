-- Remover a foreign key restritiva que impede salvar autorizados como responsáveis
ALTER TABLE pedido_porta_observacoes
DROP CONSTRAINT IF EXISTS pedido_porta_observacoes_responsavel_medidas_id_fkey;

-- Adicionar comentário explicativo na coluna
COMMENT ON COLUMN pedido_porta_observacoes.responsavel_medidas_id IS 
  'ID do responsável. Usar tipo_responsavel para determinar a tabela de origem (admin_users ou autorizados)';