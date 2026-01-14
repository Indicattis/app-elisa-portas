-- Excluir pedidos 0085, 0125, 0098, 0097 e todos os dados relacionados

-- IDs dos pedidos:
-- 0085: 3d2fa579-3526-4ba5-b3ab-4671ee883850
-- 0097: 94183923-6ad5-4703-83f4-bc34716434ed
-- 0098: f12ef45f-e382-48f0-845a-fdf0668c4890
-- 0125: 9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7

-- Primeiro, excluir pontuações de colaboradores que referenciam linhas_ordens
DELETE FROM pontuacao_colaboradores WHERE linha_id IN (
  SELECT lo.id FROM linhas_ordens lo
  JOIN ordens_soldagem os ON lo.ordem_id = os.id
  WHERE os.pedido_id IN (
    '3d2fa579-3526-4ba5-b3ab-4671ee883850',
    '94183923-6ad5-4703-83f4-bc34716434ed',
    'f12ef45f-e382-48f0-845a-fdf0668c4890',
    '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
  )
  UNION ALL
  SELECT lo.id FROM linhas_ordens lo
  JOIN ordens_perfiladeira op ON lo.ordem_id = op.id
  WHERE op.pedido_id IN (
    '3d2fa579-3526-4ba5-b3ab-4671ee883850',
    '94183923-6ad5-4703-83f4-bc34716434ed',
    'f12ef45f-e382-48f0-845a-fdf0668c4890',
    '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
  )
);

-- Excluir linhas_ordens das ordens de soldagem
DELETE FROM linhas_ordens WHERE ordem_id IN (
  SELECT id FROM ordens_soldagem WHERE pedido_id IN (
    '3d2fa579-3526-4ba5-b3ab-4671ee883850',
    '94183923-6ad5-4703-83f4-bc34716434ed',
    'f12ef45f-e382-48f0-845a-fdf0668c4890',
    '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
  )
);

-- Excluir linhas_ordens das ordens de perfiladeira
DELETE FROM linhas_ordens WHERE ordem_id IN (
  SELECT id FROM ordens_perfiladeira WHERE pedido_id IN (
    '3d2fa579-3526-4ba5-b3ab-4671ee883850',
    '94183923-6ad5-4703-83f4-bc34716434ed',
    'f12ef45f-e382-48f0-845a-fdf0668c4890',
    '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
  )
);

-- Excluir ordens de soldagem
DELETE FROM ordens_soldagem WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir ordens de perfiladeira
DELETE FROM ordens_perfiladeira WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir ordens de separação
DELETE FROM ordens_separacao WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir ordens de qualidade
DELETE FROM ordens_qualidade WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir ordens de pintura
DELETE FROM ordens_pintura WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir ordens de carregamento
DELETE FROM ordens_carregamento WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir linhas do pedido
DELETE FROM pedido_linhas WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir etapas do pedido
DELETE FROM pedidos_etapas WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir movimentações do pedido
DELETE FROM pedidos_movimentacoes WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Excluir instalações associadas
DELETE FROM instalacoes WHERE pedido_id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);

-- Finalmente, excluir os pedidos
DELETE FROM pedidos_producao WHERE id IN (
  '3d2fa579-3526-4ba5-b3ab-4671ee883850',
  '94183923-6ad5-4703-83f4-bc34716434ed',
  'f12ef45f-e382-48f0-845a-fdf0668c4890',
  '9b351d8a-ef5a-44e5-ae7b-3ab3867ce1d7'
);