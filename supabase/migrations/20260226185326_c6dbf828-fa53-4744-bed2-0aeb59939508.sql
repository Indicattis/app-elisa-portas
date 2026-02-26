
-- 1. Fechar etapa instalacoes para ambos os pedidos
UPDATE pedidos_etapas SET data_saida = now() 
WHERE pedido_id IN ('5ee4873b-caf7-4be8-b00e-acca2e00f55d', 'f57b1e16-7ecb-418f-a881-0b4e6ca6dc63') 
AND etapa = 'instalacoes' AND data_saida IS NULL;

-- 2. Criar etapa finalizado para ambos (upsert para evitar conflito)
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
VALUES 
  ('5ee4873b-caf7-4be8-b00e-acca2e00f55d', 'finalizado', '[]'::jsonb, now()),
  ('f57b1e16-7ecb-418f-a881-0b4e6ca6dc63', 'finalizado', '[]'::jsonb, now())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb;

-- 3. Atualizar etapa_atual para finalizado
UPDATE pedidos_producao SET etapa_atual = 'finalizado' 
WHERE id IN ('5ee4873b-caf7-4be8-b00e-acca2e00f55d', 'f57b1e16-7ecb-418f-a881-0b4e6ca6dc63');

-- 4. Registrar movimentacoes de avanco instalacoes -> finalizado (usando user_id do Administrador)
INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
VALUES 
  ('5ee4873b-caf7-4be8-b00e-acca2e00f55d', 'd4f3da0b-cadf-4458-8274-1b4997e61033', 'instalacoes', 'finalizado', 'avanco', 'Correção: pedido movido para finalizado (carregamento já concluído)'),
  ('f57b1e16-7ecb-418f-a881-0b4e6ca6dc63', 'd4f3da0b-cadf-4458-8274-1b4997e61033', 'instalacoes', 'finalizado', 'avanco', 'Correção: pedido movido para finalizado (carregamento já concluído)');
