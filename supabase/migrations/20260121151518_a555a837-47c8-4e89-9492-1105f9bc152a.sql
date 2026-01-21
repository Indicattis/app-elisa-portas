-- 1. Excluir linhas da ordem de qualidade criadas indevidamente
DELETE FROM linhas_ordens 
WHERE ordem_id = 'aef24c08-a714-4798-846c-7efcc17cc9c5' 
  AND tipo_ordem = 'qualidade';

-- 2. Excluir a ordem de qualidade criada indevidamente
DELETE FROM ordens_qualidade 
WHERE id = 'aef24c08-a714-4798-846c-7efcc17cc9c5';

-- 3. Retornar o pedido para "Em Produção"
UPDATE pedidos_producao
SET 
  etapa_atual = 'em_producao',
  updated_at = NOW()
WHERE id = 'fb5a0149-e561-4724-aec8-ad4c79869ddc';

-- 4. Registrar a movimentação de correção
INSERT INTO pedidos_movimentacoes (
  id, pedido_id, user_id, etapa_origem, etapa_destino, 
  teor, descricao, data_hora, created_at
) VALUES (
  gen_random_uuid(),
  'fb5a0149-e561-4724-aec8-ad4c79869ddc',
  '687c1e07-bfc3-4fed-b074-a9d141f2f1f0',
  'inspecao_qualidade',
  'em_producao',
  'avanco',
  'Correção: pedido retornado pois ordem de separação estava pausada por falta de material',
  NOW(), NOW()
);