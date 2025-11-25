-- Avançar pedido 07572d5a-638d-47c1-b187-0ec24e6e07a6 de aguardando_pintura para aguardando_coleta

-- Fechar etapa atual
UPDATE pedidos_etapas 
SET data_saida = now() 
WHERE pedido_id = '07572d5a-638d-47c1-b187-0ec24e6e07a6' 
AND etapa = 'aguardando_pintura'
AND data_saida IS NULL;

-- Criar nova etapa
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
VALUES (
  '07572d5a-638d-47c1-b187-0ec24e6e07a6',
  'aguardando_coleta',
  '[{"id": "check_carregamento_agendado", "label": "Carregamento agendado", "checked": false, "required": true}]'::jsonb
);

-- Atualizar pedido
UPDATE pedidos_producao
SET etapa_atual = 'aguardando_coleta',
    updated_at = now()
WHERE id = '07572d5a-638d-47c1-b187-0ec24e6e07a6';

-- Criar ordem de carregamento
INSERT INTO ordens_carregamento (
  pedido_id,
  venda_id,
  nome_cliente,
  hora,
  status,
  tipo_carregamento
)
SELECT 
  '07572d5a-638d-47c1-b187-0ec24e6e07a6',
  pp.venda_id,
  v.cliente_nome,
  '08:00',
  'pronta_fabrica',
  'elisa'
FROM pedidos_producao pp
JOIN vendas v ON pp.venda_id = v.id
WHERE pp.id = '07572d5a-638d-47c1-b187-0ec24e6e07a6'
AND NOT EXISTS (
  SELECT 1 FROM ordens_carregamento 
  WHERE pedido_id = '07572d5a-638d-47c1-b187-0ec24e6e07a6'
);