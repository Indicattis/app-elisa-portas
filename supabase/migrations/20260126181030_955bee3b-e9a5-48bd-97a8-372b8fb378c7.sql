-- Corrigir Pedido 0157: Avançar para inspeção de qualidade e criar ordem de qualidade

-- 1. Fechar etapa em_producao que ainda não foi fechada
UPDATE pedidos_etapas
SET data_saida = NOW()
WHERE pedido_id = '8c4cd1a9-671b-4b49-be27-458397f9330b'
  AND etapa = 'em_producao'
  AND data_saida IS NULL;

-- 2. Criar etapa inspecao_qualidade (apenas se não existir)
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
SELECT '8c4cd1a9-671b-4b49-be27-458397f9330b', 'inspecao_qualidade', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pedidos_etapas 
  WHERE pedido_id = '8c4cd1a9-671b-4b49-be27-458397f9330b' 
  AND etapa = 'inspecao_qualidade'
);

-- 3. Atualizar pedido
UPDATE pedidos_producao
SET etapa_atual = 'inspecao_qualidade',
    updated_at = NOW()
WHERE id = '8c4cd1a9-671b-4b49-be27-458397f9330b';

-- 4. Criar ordem de qualidade (apenas se não existir)
INSERT INTO ordens_qualidade (pedido_id, status, numero_ordem)
SELECT 
  '8c4cd1a9-671b-4b49-be27-458397f9330b',
  'pendente',
  (SELECT numero_pedido FROM pedidos_producao WHERE id = '8c4cd1a9-671b-4b49-be27-458397f9330b')
WHERE NOT EXISTS (
  SELECT 1 FROM ordens_qualidade 
  WHERE pedido_id = '8c4cd1a9-671b-4b49-be27-458397f9330b'
);

-- 5. Registrar movimentacao com teor válido
INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
VALUES (
  '8c4cd1a9-671b-4b49-be27-458397f9330b',
  'd4f3da0b-cadf-4458-8274-1b4997e61033',
  'em_producao',
  'inspecao_qualidade',
  'avanco',
  'Avanço manual via migração - correção de auto-avanço que não funcionou'
);