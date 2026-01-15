-- Drop e recriar a função RPC para retornar os IDs do pedido e das ordens
DROP FUNCTION IF EXISTS public.get_pedidos_com_status_ordens();

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
  SELECT
    pp.id as pedido_id,
    pp.numero_pedido::text,
    pp.numero_mes,
    pp.etapa_atual::text,
    v.cliente_nome::text as nome_cliente,
    pp.data_entrega,
    pp.data_carregamento,
    pp.prioridade_etapa as prioridade,
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
    (os.id IS NOT NULL) as soldagem_existe,
    os.status::text as soldagem_status,
    (os.responsavel_id IS NOT NULL) as soldagem_capturada,
    au_sold.foto_perfil_url as soldagem_capturada_por_foto,
    COALESCE(os.pausada, false) as soldagem_pausada,
    os.justificativa_pausa as soldagem_justificativa_pausa,
    os.id as soldagem_ordem_id,
    os.numero_ordem as soldagem_numero_ordem,
    (op.id IS NOT NULL) as perfiladeira_existe,
    op.status::text as perfiladeira_status,
    (op.responsavel_id IS NOT NULL) as perfiladeira_capturada,
    au_perf.foto_perfil_url as perfiladeira_capturada_por_foto,
    COALESCE(op.pausada, false) as perfiladeira_pausada,
    op.justificativa_pausa as perfiladeira_justificativa_pausa,
    op.id as perfiladeira_ordem_id,
    op.numero_ordem as perfiladeira_numero_ordem,
    (osp.id IS NOT NULL) as separacao_existe,
    osp.status::text as separacao_status,
    (osp.responsavel_id IS NOT NULL) as separacao_capturada,
    au_sep.foto_perfil_url as separacao_capturada_por_foto,
    COALESCE(osp.pausada, false) as separacao_pausada,
    osp.justificativa_pausa as separacao_justificativa_pausa,
    osp.id as separacao_ordem_id,
    osp.numero_ordem as separacao_numero_ordem,
    (oq.id IS NOT NULL) as qualidade_existe,
    oq.status::text as qualidade_status,
    (oq.responsavel_id IS NOT NULL) as qualidade_capturada,
    au_qual.foto_perfil_url as qualidade_capturada_por_foto,
    COALESCE(oq.pausada, false) as qualidade_pausada,
    oq.justificativa_pausa as qualidade_justificativa_pausa,
    oq.id as qualidade_ordem_id,
    oq.numero_ordem as qualidade_numero_ordem,
    (opint.id IS NOT NULL) as pintura_existe,
    opint.status::text as pintura_status,
    (opint.responsavel_id IS NOT NULL) as pintura_capturada,
    au_pint.foto_perfil_url as pintura_capturada_por_foto,
    false as pintura_pausada,
    null::text as pintura_justificativa_pausa,
    opint.id as pintura_ordem_id,
    opint.numero_ordem as pintura_numero_ordem
  FROM pedidos_producao pp
  LEFT JOIN vendas v ON pp.venda_id = v.id
  LEFT JOIN ordens_soldagem os ON os.pedido_id = pp.id
  LEFT JOIN admin_users au_sold ON au_sold.user_id = os.responsavel_id
  LEFT JOIN ordens_perfiladeira op ON op.pedido_id = pp.id
  LEFT JOIN admin_users au_perf ON au_perf.user_id = op.responsavel_id
  LEFT JOIN ordens_separacao osp ON osp.pedido_id = pp.id
  LEFT JOIN admin_users au_sep ON au_sep.user_id = osp.responsavel_id
  LEFT JOIN ordens_qualidade oq ON oq.pedido_id = pp.id
  LEFT JOIN admin_users au_qual ON au_qual.user_id = oq.responsavel_id
  LEFT JOIN ordens_pintura opint ON opint.pedido_id = pp.id
  LEFT JOIN admin_users au_pint ON au_pint.user_id = opint.responsavel_id
  WHERE pp.status = 'em_andamento' AND pp.etapa_atual = 'em_producao'
  ORDER BY pp.prioridade_etapa DESC, pp.data_entrega ASC NULLS LAST;
END;
$$;