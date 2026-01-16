-- Fix: Use correct table names (ordens_soldagem, ordens_perfiladeira, etc.) instead of ordens_producao
-- And use responsavel_id instead of capturada_por

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
    os.id IS NOT NULL as soldagem_existe,
    os.status as soldagem_status,
    os.responsavel_id IS NOT NULL as soldagem_capturada,
    aus.foto_perfil_url as soldagem_capturada_por_foto,
    COALESCE(os.pausada, false) as soldagem_pausada,
    os.justificativa_pausa as soldagem_justificativa_pausa,
    os.id as soldagem_ordem_id,
    os.numero_ordem as soldagem_numero_ordem,
    -- Perfiladeira
    oper.id IS NOT NULL as perfiladeira_existe,
    oper.status as perfiladeira_status,
    oper.responsavel_id IS NOT NULL as perfiladeira_capturada,
    auper.foto_perfil_url as perfiladeira_capturada_por_foto,
    COALESCE(oper.pausada, false) as perfiladeira_pausada,
    oper.justificativa_pausa as perfiladeira_justificativa_pausa,
    oper.id as perfiladeira_ordem_id,
    oper.numero_ordem as perfiladeira_numero_ordem,
    -- Separacao
    osep.id IS NOT NULL as separacao_existe,
    osep.status as separacao_status,
    osep.responsavel_id IS NOT NULL as separacao_capturada,
    ausep.foto_perfil_url as separacao_capturada_por_foto,
    COALESCE(osep.pausada, false) as separacao_pausada,
    osep.justificativa_pausa as separacao_justificativa_pausa,
    osep.id as separacao_ordem_id,
    osep.numero_ordem as separacao_numero_ordem,
    -- Qualidade
    oq.id IS NOT NULL as qualidade_existe,
    oq.status as qualidade_status,
    oq.responsavel_id IS NOT NULL as qualidade_capturada,
    auq.foto_perfil_url as qualidade_capturada_por_foto,
    COALESCE(oq.pausada, false) as qualidade_pausada,
    oq.justificativa_pausa as qualidade_justificativa_pausa,
    oq.id as qualidade_ordem_id,
    oq.numero_ordem as qualidade_numero_ordem,
    -- Pintura
    opin.id IS NOT NULL as pintura_existe,
    opin.status as pintura_status,
    opin.responsavel_id IS NOT NULL as pintura_capturada,
    aupin.foto_perfil_url as pintura_capturada_por_foto,
    COALESCE(opin.pausada, false) as pintura_pausada,
    opin.justificativa_pausa as pintura_justificativa_pausa,
    opin.id as pintura_ordem_id,
    opin.numero_ordem as pintura_numero_ordem
  FROM pedidos_ativos pa
  LEFT JOIN produtos_por_pedido pp ON pp.pedido_id = pa.id
  -- Soldagem
  LEFT JOIN ordens_soldagem os ON os.pedido_id = pa.id
  LEFT JOIN admin_users aus ON os.responsavel_id = aus.user_id
  -- Perfiladeira
  LEFT JOIN ordens_perfiladeira oper ON oper.pedido_id = pa.id
  LEFT JOIN admin_users auper ON oper.responsavel_id = auper.user_id
  -- Separacao
  LEFT JOIN ordens_separacao osep ON osep.pedido_id = pa.id
  LEFT JOIN admin_users ausep ON osep.responsavel_id = ausep.user_id
  -- Qualidade
  LEFT JOIN ordens_qualidade oq ON oq.pedido_id = pa.id
  LEFT JOIN admin_users auq ON oq.responsavel_id = auq.user_id
  -- Pintura
  LEFT JOIN ordens_pintura opin ON opin.pedido_id = pa.id
  LEFT JOIN admin_users aupin ON opin.responsavel_id = aupin.user_id;
END;
$$;