-- Migração: Remover linhas duplicadas de soldagem

-- Etapa 1: Deletar pontuações vinculadas a linhas duplicadas (sem pedido_linha_id)
-- Como as linhas corretas (com pedido_linha_id) já podem ter pontuações,
-- simplesmente removemos as pontuações órfãs das duplicatas
DELETE FROM pontuacao_colaboradores
WHERE linha_id IN (
  SELECT id FROM linhas_ordens 
  WHERE tipo_ordem = 'soldagem' AND pedido_linha_id IS NULL
);

-- Etapa 2: Deletar as linhas duplicadas de soldagem (sem pedido_linha_id)
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'soldagem'
  AND pedido_linha_id IS NULL;