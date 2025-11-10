-- Limpar etapas duplicadas de inspecao_qualidade que ficaram abertas
-- Manter apenas a mais recente e fechar as antigas

-- Fechar todas as etapas de inspecao_qualidade antigas que estão sem data_saida
UPDATE pedidos_etapas
SET data_saida = data_entrada
WHERE pedido_id = '521d3633-0730-42c8-9468-fcf295989cec'
  AND etapa = 'inspecao_qualidade'
  AND data_saida IS NULL
  AND data_entrada < '2025-11-10 22:48:55.975559+00';