-- Remove linhas duplicadas de separação que não têm pedido_linha_id
-- Estas são cópias antigas criadas antes da correção do sistema de prevenção de duplicatas
-- A verificação prévia confirmou que todas as ordens afetadas possuem linhas válidas com pedido_linha_id

DELETE FROM linhas_ordens
WHERE tipo_ordem = 'separacao'
  AND pedido_linha_id IS NULL;