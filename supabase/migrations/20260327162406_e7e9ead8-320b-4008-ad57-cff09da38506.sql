
-- Fix pedido 0142 (S E E Engenharia) - corrigir dados inconsistentes
UPDATE ordens_carregamento 
SET carregamento_concluido = true, 
    carregamento_concluido_em = now()
WHERE id = '0dbbf6bb-3f36-40bc-bfb2-46a3892dcaaf';

UPDATE pedidos_producao 
SET etapa_atual = 'finalizado'
WHERE id = 'ef4875b6-9a8e-4094-97f6-efd206265ce0';

-- Registrar saída da etapa aguardando_coleta
UPDATE pedidos_etapas 
SET data_saida = now()
WHERE pedido_id = 'ef4875b6-9a8e-4094-97f6-efd206265ce0' 
  AND etapa = 'aguardando_coleta' 
  AND data_saida IS NULL;

-- Registrar entrada na etapa finalizado (upsert para evitar conflito)
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
VALUES ('ef4875b6-9a8e-4094-97f6-efd206265ce0', 'finalizado', now())
ON CONFLICT (pedido_id, etapa) 
DO UPDATE SET data_entrada = now(), data_saida = NULL;
