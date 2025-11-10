-- Corrigir pedido que foi avançado incorretamente para aguardando_pintura sem ter pintura
-- Pedido: 521d3633-0730-42c8-9468-fcf295989cec (PED-000077)

-- 1. Voltar o pedido para inspecao_qualidade
UPDATE pedidos_producao
SET etapa_atual = 'inspecao_qualidade'
WHERE id = '521d3633-0730-42c8-9468-fcf295989cec'
  AND etapa_atual = 'aguardando_pintura';

-- 2. Remover a etapa de aguardando_pintura criada incorretamente
DELETE FROM pedidos_etapas
WHERE pedido_id = '521d3633-0730-42c8-9468-fcf295989cec'
  AND etapa = 'aguardando_pintura';

-- 3. Reabrir a etapa de inspecao_qualidade (remover data_saida)
UPDATE pedidos_etapas
SET data_saida = NULL
WHERE pedido_id = '521d3633-0730-42c8-9468-fcf295989cec'
  AND etapa = 'inspecao_qualidade';