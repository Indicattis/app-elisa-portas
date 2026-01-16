-- Update the RPC to include largura and altura in produtos_lista
CREATE OR REPLACE FUNCTION get_pedidos_com_status_ordens()
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
  -- Soldagem
  soldagem_existe boolean,
  soldagem_status text,
  soldagem_capturada boolean,
  soldagem_capturada_por_foto text,
  soldagem_pausada boolean,
  soldagem_justificativa_pausa text,
  soldagem_ordem_id uuid,
  soldagem_numero_ordem text,
  -- Perfiladeira
  perfiladeira_existe boolean,
  perfiladeira_status text,
  perfiladeira_capturada boolean,
  perfiladeira_capturada_por_foto text,
  perfiladeira_pausada boolean,
  perfiladeira_justificativa_pausa text,
  perfiladeira_ordem_id uuid,
  perfiladeira_numero_ordem text,
  -- Separacao
  separacao_existe boolean,
  separacao_status text,
  separacao_capturada boolean,
  separacao_capturada_por_foto text,
  separacao_pausada boolean,
  separacao_justificativa_pausa text,
  separacao_ordem_id uuid,
  separacao_numero_ordem text,
  -- Qualidade
  qualidade_existe boolean,
  qualidade_status text,
  qualidade_capturada boolean,
  qualidade_capturada_por_foto text,
  qualidade_pausada boolean,
  qualidade_justificativa_pausa text,
  qualidade_ordem_id uuid,
  qualidade_numero_ordem text,
  -- Pintura
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
      p.prioridade,
      v.id as venda_id,
      c.nome as cliente_nome
    FROM pedidos p
    LEFT JOIN vendas v ON p.venda_id = v.id
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE p.etapa_atual NOT IN ('concluido', 'cancelado')
    ORDER BY p.prioridade ASC, p.data_entrega ASC NULLS LAST
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
    LEFT JOIN produtos_venda pv ON pv.venda_id = pa.venda_id
    GROUP BY pa.id
  ),
  ordens_info AS (
    SELECT
      pa.id as pedido_id,
      -- Soldagem
      bool_or(op.tipo_ordem = 'soldagem') as soldagem_existe,
      MAX(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.status END) as soldagem_status,
      bool_or(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.capturada ELSE false END) as soldagem_capturada,
      MAX(CASE WHEN op.tipo_ordem = 'soldagem' THEN au.foto_perfil_url END) as soldagem_capturada_por_foto,
      bool_or(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.pausada ELSE false END) as soldagem_pausada,
      MAX(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.justificativa_pausa END) as soldagem_justificativa_pausa,
      MAX(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.id END) as soldagem_ordem_id,
      MAX(CASE WHEN op.tipo_ordem = 'soldagem' THEN op.numero_ordem END) as soldagem_numero_ordem,
      -- Perfiladeira
      bool_or(op.tipo_ordem = 'perfiladeira') as perfiladeira_existe,
      MAX(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.status END) as perfiladeira_status,
      bool_or(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.capturada ELSE false END) as perfiladeira_capturada,
      MAX(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN au.foto_perfil_url END) as perfiladeira_capturada_por_foto,
      bool_or(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.pausada ELSE false END) as perfiladeira_pausada,
      MAX(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.justificativa_pausa END) as perfiladeira_justificativa_pausa,
      MAX(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.id END) as perfiladeira_ordem_id,
      MAX(CASE WHEN op.tipo_ordem = 'perfiladeira' THEN op.numero_ordem END) as perfiladeira_numero_ordem,
      -- Separacao
      bool_or(op.tipo_ordem = 'separacao') as separacao_existe,
      MAX(CASE WHEN op.tipo_ordem = 'separacao' THEN op.status END) as separacao_status,
      bool_or(CASE WHEN op.tipo_ordem = 'separacao' THEN op.capturada ELSE false END) as separacao_capturada,
      MAX(CASE WHEN op.tipo_ordem = 'separacao' THEN au.foto_perfil_url END) as separacao_capturada_por_foto,
      bool_or(CASE WHEN op.tipo_ordem = 'separacao' THEN op.pausada ELSE false END) as separacao_pausada,
      MAX(CASE WHEN op.tipo_ordem = 'separacao' THEN op.justificativa_pausa END) as separacao_justificativa_pausa,
      MAX(CASE WHEN op.tipo_ordem = 'separacao' THEN op.id END) as separacao_ordem_id,
      MAX(CASE WHEN op.tipo_ordem = 'separacao' THEN op.numero_ordem END) as separacao_numero_ordem,
      -- Qualidade
      bool_or(op.tipo_ordem = 'qualidade') as qualidade_existe,
      MAX(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.status END) as qualidade_status,
      bool_or(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.capturada ELSE false END) as qualidade_capturada,
      MAX(CASE WHEN op.tipo_ordem = 'qualidade' THEN au.foto_perfil_url END) as qualidade_capturada_por_foto,
      bool_or(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.pausada ELSE false END) as qualidade_pausada,
      MAX(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.justificativa_pausa END) as qualidade_justificativa_pausa,
      MAX(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.id END) as qualidade_ordem_id,
      MAX(CASE WHEN op.tipo_ordem = 'qualidade' THEN op.numero_ordem END) as qualidade_numero_ordem,
      -- Pintura
      bool_or(op.tipo_ordem = 'pintura') as pintura_existe,
      MAX(CASE WHEN op.tipo_ordem = 'pintura' THEN op.status END) as pintura_status,
      bool_or(CASE WHEN op.tipo_ordem = 'pintura' THEN op.capturada ELSE false END) as pintura_capturada,
      MAX(CASE WHEN op.tipo_ordem = 'pintura' THEN au.foto_perfil_url END) as pintura_capturada_por_foto,
      bool_or(CASE WHEN op.tipo_ordem = 'pintura' THEN op.pausada ELSE false END) as pintura_pausada,
      MAX(CASE WHEN op.tipo_ordem = 'pintura' THEN op.justificativa_pausa END) as pintura_justificativa_pausa,
      MAX(CASE WHEN op.tipo_ordem = 'pintura' THEN op.id END) as pintura_ordem_id,
      MAX(CASE WHEN op.tipo_ordem = 'pintura' THEN op.numero_ordem END) as pintura_numero_ordem
    FROM pedidos_ativos pa
    LEFT JOIN ordens_producao op ON op.pedido_id = pa.id
    LEFT JOIN admin_users au ON op.capturada_por = au.user_id
    GROUP BY pa.id
  )
  SELECT
    pa.id as pedido_id,
    pa.numero_pedido,
    pa.numero_mes,
    pa.etapa_atual,
    pa.cliente_nome as nome_cliente,
    pa.data_entrega,
    pa.data_carregamento,
    COALESCE(pa.prioridade, 999) as prioridade,
    pp.produtos as produtos_lista,
    -- Soldagem
    COALESCE(oi.soldagem_existe, false),
    oi.soldagem_status,
    COALESCE(oi.soldagem_capturada, false),
    oi.soldagem_capturada_por_foto,
    COALESCE(oi.soldagem_pausada, false),
    oi.soldagem_justificativa_pausa,
    oi.soldagem_ordem_id,
    oi.soldagem_numero_ordem,
    -- Perfiladeira
    COALESCE(oi.perfiladeira_existe, false),
    oi.perfiladeira_status,
    COALESCE(oi.perfiladeira_capturada, false),
    oi.perfiladeira_capturada_por_foto,
    COALESCE(oi.perfiladeira_pausada, false),
    oi.perfiladeira_justificativa_pausa,
    oi.perfiladeira_ordem_id,
    oi.perfiladeira_numero_ordem,
    -- Separacao
    COALESCE(oi.separacao_existe, false),
    oi.separacao_status,
    COALESCE(oi.separacao_capturada, false),
    oi.separacao_capturada_por_foto,
    COALESCE(oi.separacao_pausada, false),
    oi.separacao_justificativa_pausa,
    oi.separacao_ordem_id,
    oi.separacao_numero_ordem,
    -- Qualidade
    COALESCE(oi.qualidade_existe, false),
    oi.qualidade_status,
    COALESCE(oi.qualidade_capturada, false),
    oi.qualidade_capturada_por_foto,
    COALESCE(oi.qualidade_pausada, false),
    oi.qualidade_justificativa_pausa,
    oi.qualidade_ordem_id,
    oi.qualidade_numero_ordem,
    -- Pintura
    COALESCE(oi.pintura_existe, false),
    oi.pintura_status,
    COALESCE(oi.pintura_capturada, false),
    oi.pintura_capturada_por_foto,
    COALESCE(oi.pintura_pausada, false),
    oi.pintura_justificativa_pausa,
    oi.pintura_ordem_id,
    oi.pintura_numero_ordem
  FROM pedidos_ativos pa
  LEFT JOIN produtos_por_pedido pp ON pp.pedido_id = pa.id
  LEFT JOIN ordens_info oi ON oi.pedido_id = pa.id;
END;
$$;