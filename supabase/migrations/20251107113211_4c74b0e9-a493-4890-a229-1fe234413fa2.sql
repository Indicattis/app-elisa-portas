-- Sincronizar status de TODAS as instalações com base na última etapa do pedido
WITH ultimas_etapas AS (
  SELECT DISTINCT ON (pedido_id) 
    pedido_id,
    etapa
  FROM pedidos_etapas
  ORDER BY 
    pedido_id,
    CASE 
      WHEN data_saida IS NULL THEN data_entrada
      ELSE data_saida
    END DESC
)
UPDATE instalacoes_cadastradas ic
SET 
  status = CASE
    WHEN ue.etapa IN ('aguardando_instalacao', 'aguardando_coleta') 
      THEN 'pronta_fabrica'
    WHEN ue.etapa = 'finalizado' AND ic.instalacao_concluida = false
      THEN 'pronta_fabrica'
    WHEN ue.etapa IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura')
      THEN 'pendente_producao'
    ELSE ic.status
  END,
  updated_at = now()
FROM ultimas_etapas ue
WHERE 
  ic.pedido_id = ue.pedido_id 
  AND ic.instalacao_concluida = false
  AND ic.status != 'finalizada';