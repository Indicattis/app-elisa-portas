-- Fix: Column name is prioridade_etapa, not prioridade

CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_ordens()
RETURNS TABLE(
  pedido_id uuid,
  numero_pedido text,
  numero_mes integer,
  etapa_atual text,
  nome_cliente text,
  data_entrega date,
  data_carregamento date,
  prioridade integer,
  produtos_lista jsonb,
  soldagem_existe boolean,
  soldagem_status text,
  soldagem_capturada boolean,
  soldagem_capturada_por_foto text,
  soldagem_pausada boolean,
  soldagem_justificativa_pausa text,
  soldagem_ordem_id uuid,
  soldagem_numero_ordem text,
  perfiladeira_existe boolean,
  perfiladeira_status text,
  perfiladeira_capturada boolean,
  perfiladeira_capturada_por_foto text,
  perfiladeira_pausada boolean,
  perfiladeira_justificativa_pausa text,
  perfiladeira_ordem_id uuid,
  perfiladeira_numero_ordem text,
  separacao_existe boolean,
  separacao_status text,
  separacao_capturada boolean,
  separacao_capturada_por_foto text,
  separacao_pausada boolean,
  separacao_justificativa_pausa text,
  separacao_ordem_id uuid,
  separacao_numero_ordem text,
  qualidade_existe boolean,
  qualidade_status text,
  qualidade_capturada boolean,
  qualidade_capturada_por_foto text,
  qualidade_pausada boolean,
  qualidade_justificativa_pausa text,
  qualidade_ordem_id uuid,
  qualidade_numero_ordem text,
  pintura_existe boolean,
  pintura_status text,
  pintura_capturada boolean,
  pintura_capturada_por_foto text,
  pintura_pausada boolean,
  pintura_justificativa_pausa text,
  pintura_ordem_id uuid,
  pintura_numero_ordem text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH pedidos_ativos AS (
    SELECT 
      p.id,
      p.numero_pedido,
      p.numero_mes,
      p.etapa_atual,
      p.data_entrega,
      p.data_carregamento,
      p.prioridade_etapa as prioridade,
      v.id as venda_id,
      c.nome as cliente_nome
    FROM pedidos_producao p
    LEFT JOIN vendas v ON p.venda_id = v.id
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE p.etapa_atual NOT IN ('concluido', 'cancelado')
    ORDER BY p.prioridade_etapa ASC, p.data_entrega ASC NULLS LAST
  ),
  produtos_por_pedido AS (
    SELECT 
      pa.id as pedido_id,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'tipo', pv.tipo_produto,
            'descricao', COALESCE(pv.descricao, pv.tipo_produto),
            'tamanho', pv.tamanho,
            'quantidade', COALESCE(pv.quantidade, 1),
            'largura', pv.largura,
            'altura', pv.altura
          )
        ) FILTER (WHERE pv.id IS NOT NULL),
        '[]'::jsonb
      ) as produtos
    FROM pedidos_ativos pa
    LEFT JOIN produtos_vendas pv ON pv.venda_id = pa.venda_id
    GROUP BY pa.id
  ),
  ordens_por_pedido AS (
    SELECT 
      o.pedido_id,
      o.setor,
      o.id as ordem_id,
      o.numero_ordem,
      o.status,
      o.capturada,
      o.pausada,
      o.justificativa_pausa,
      au.foto_perfil_url as capturada_por_foto
    FROM ordens_producao o
    LEFT JOIN admin_users au ON o.capturada_por = au.user_id
    WHERE o.pedido_id IN (SELECT id FROM pedidos_ativos)
  )
  SELECT 
    pa.id as pedido_id,
    pa.numero_pedido,
    pa.numero_mes,
    pa.etapa_atual,
    pa.cliente_nome as nome_cliente,
    pa.data_entrega,
    pa.data_carregamento,
    pa.prioridade,
    COALESCE(pp.produtos, '[]'::jsonb) as produtos_lista,
    -- Soldagem
    EXISTS(SELECT 1 FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem') as soldagem_existe,
    (SELECT op.status FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1) as soldagem_status,
    COALESCE((SELECT op.capturada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1), false) as soldagem_capturada,
    (SELECT op.capturada_por_foto FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1) as soldagem_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1), false) as soldagem_pausada,
    (SELECT op.justificativa_pausa FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1) as soldagem_justificativa_pausa,
    (SELECT op.ordem_id FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1) as soldagem_ordem_id,
    (SELECT op.numero_ordem FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'soldagem' LIMIT 1) as soldagem_numero_ordem,
    -- Perfiladeira
    EXISTS(SELECT 1 FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira') as perfiladeira_existe,
    (SELECT op.status FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1) as perfiladeira_status,
    COALESCE((SELECT op.capturada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1), false) as perfiladeira_capturada,
    (SELECT op.capturada_por_foto FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1) as perfiladeira_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1), false) as perfiladeira_pausada,
    (SELECT op.justificativa_pausa FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1) as perfiladeira_justificativa_pausa,
    (SELECT op.ordem_id FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1) as perfiladeira_ordem_id,
    (SELECT op.numero_ordem FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'perfiladeira' LIMIT 1) as perfiladeira_numero_ordem,
    -- Separacao
    EXISTS(SELECT 1 FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao') as separacao_existe,
    (SELECT op.status FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1) as separacao_status,
    COALESCE((SELECT op.capturada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1), false) as separacao_capturada,
    (SELECT op.capturada_por_foto FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1) as separacao_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1), false) as separacao_pausada,
    (SELECT op.justificativa_pausa FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1) as separacao_justificativa_pausa,
    (SELECT op.ordem_id FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1) as separacao_ordem_id,
    (SELECT op.numero_ordem FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'separacao' LIMIT 1) as separacao_numero_ordem,
    -- Qualidade
    EXISTS(SELECT 1 FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade') as qualidade_existe,
    (SELECT op.status FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1) as qualidade_status,
    COALESCE((SELECT op.capturada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1), false) as qualidade_capturada,
    (SELECT op.capturada_por_foto FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1) as qualidade_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1), false) as qualidade_pausada,
    (SELECT op.justificativa_pausa FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1) as qualidade_justificativa_pausa,
    (SELECT op.ordem_id FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1) as qualidade_ordem_id,
    (SELECT op.numero_ordem FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'qualidade' LIMIT 1) as qualidade_numero_ordem,
    -- Pintura
    EXISTS(SELECT 1 FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura') as pintura_existe,
    (SELECT op.status FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1) as pintura_status,
    COALESCE((SELECT op.capturada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1), false) as pintura_capturada,
    (SELECT op.capturada_por_foto FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1) as pintura_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1), false) as pintura_pausada,
    (SELECT op.justificativa_pausa FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1) as pintura_justificativa_pausa,
    (SELECT op.ordem_id FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1) as pintura_ordem_id,
    (SELECT op.numero_ordem FROM ordens_por_pedido op WHERE op.pedido_id = pa.id AND op.setor = 'pintura' LIMIT 1) as pintura_numero_ordem
  FROM pedidos_ativos pa
  LEFT JOIN produtos_por_pedido pp ON pp.pedido_id = pa.id;
END;
$$;