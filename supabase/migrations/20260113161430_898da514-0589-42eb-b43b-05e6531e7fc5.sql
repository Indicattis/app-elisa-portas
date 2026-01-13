-- Drop and recreate RPC function with produtos_lista
DROP FUNCTION IF EXISTS get_pedidos_com_status_ordens();

CREATE OR REPLACE FUNCTION get_pedidos_com_status_ordens()
RETURNS TABLE (
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
  perfiladeira_existe boolean,
  perfiladeira_status text,
  perfiladeira_capturada boolean,
  perfiladeira_capturada_por_foto text,
  perfiladeira_pausada boolean,
  perfiladeira_justificativa_pausa text,
  separacao_existe boolean,
  separacao_status text,
  separacao_capturada boolean,
  separacao_capturada_por_foto text,
  separacao_pausada boolean,
  separacao_justificativa_pausa text,
  qualidade_existe boolean,
  qualidade_status text,
  qualidade_capturada boolean,
  qualidade_capturada_por_foto text,
  qualidade_pausada boolean,
  qualidade_justificativa_pausa text,
  pintura_existe boolean,
  pintura_status text,
  pintura_capturada boolean,
  pintura_capturada_por_foto text,
  pintura_pausada boolean,
  pintura_justificativa_pausa text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.numero_pedido::text,
    pp.numero_mes,
    pp.etapa_atual::text,
    v.nome_cliente::text,
    pp.data_entrega,
    pp.data_carregamento,
    pp.prioridade,
    -- Produtos lista
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'tipo', pv.tipo_produto,
          'descricao', COALESCE(pv.descricao, pv.tipo_produto),
          'tamanho', pv.tamanho,
          'quantidade', COALESCE(pv.quantidade, 1)
        )
      ), '[]'::jsonb)
      FROM produtos_vendas pv 
      WHERE pv.venda_id = pp.venda_id
    ) as produtos_lista,
    -- Soldagem
    (os.id IS NOT NULL) as soldagem_existe,
    os.status::text as soldagem_status,
    (os.capturada_por IS NOT NULL) as soldagem_capturada,
    au_sold.foto_perfil_url as soldagem_capturada_por_foto,
    COALESCE(os.pausada, false) as soldagem_pausada,
    os.justificativa_pausa as soldagem_justificativa_pausa,
    -- Perfiladeira
    (op.id IS NOT NULL) as perfiladeira_existe,
    op.status::text as perfiladeira_status,
    (op.capturada_por IS NOT NULL) as perfiladeira_capturada,
    au_perf.foto_perfil_url as perfiladeira_capturada_por_foto,
    COALESCE(op.pausada, false) as perfiladeira_pausada,
    op.justificativa_pausa as perfiladeira_justificativa_pausa,
    -- Separacao
    (osp.id IS NOT NULL) as separacao_existe,
    osp.status::text as separacao_status,
    (osp.capturada_por IS NOT NULL) as separacao_capturada,
    au_sep.foto_perfil_url as separacao_capturada_por_foto,
    COALESCE(osp.pausada, false) as separacao_pausada,
    osp.justificativa_pausa as separacao_justificativa_pausa,
    -- Qualidade
    (oq.id IS NOT NULL) as qualidade_existe,
    oq.status::text as qualidade_status,
    (oq.capturada_por IS NOT NULL) as qualidade_capturada,
    au_qual.foto_perfil_url as qualidade_capturada_por_foto,
    COALESCE(oq.pausada, false) as qualidade_pausada,
    oq.justificativa_pausa as qualidade_justificativa_pausa,
    -- Pintura (sem pausa)
    (opint.id IS NOT NULL) as pintura_existe,
    opint.status::text as pintura_status,
    (opint.capturada_por IS NOT NULL) as pintura_capturada,
    au_pint.foto_perfil_url as pintura_capturada_por_foto,
    false as pintura_pausada,
    null::text as pintura_justificativa_pausa
  FROM pedidos_producao pp
  LEFT JOIN vendas v ON pp.venda_id = v.id
  LEFT JOIN ordens_soldagem os ON os.pedido_id = pp.id
  LEFT JOIN admin_users au_sold ON au_sold.user_id = os.capturada_por
  LEFT JOIN ordens_perfiladeira op ON op.pedido_id = pp.id
  LEFT JOIN admin_users au_perf ON au_perf.user_id = op.capturada_por
  LEFT JOIN ordens_separacao osp ON osp.pedido_id = pp.id
  LEFT JOIN admin_users au_sep ON au_sep.user_id = osp.capturada_por
  LEFT JOIN ordens_qualidade oq ON oq.pedido_id = pp.id
  LEFT JOIN admin_users au_qual ON au_qual.user_id = oq.capturada_por
  LEFT JOIN ordens_pintura opint ON opint.pedido_id = pp.id
  LEFT JOIN admin_users au_pint ON au_pint.user_id = opint.capturada_por
  WHERE pp.status = 'em_producao'
  ORDER BY pp.prioridade ASC, pp.data_entrega ASC NULLS LAST;
END;
$$;