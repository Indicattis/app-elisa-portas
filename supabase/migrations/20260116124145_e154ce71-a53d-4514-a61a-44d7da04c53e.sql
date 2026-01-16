CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_ordens()
RETURNS TABLE (
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as pedido_id,
    p.numero_pedido,
    p.numero_mes,
    p.etapa_atual,
    p.nome_cliente,
    p.data_entrega,
    p.data_carregamento,
    p.prioridade_etapa as prioridade,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'tipo', pp.tipo_produto,
        'descricao', pp.descricao,
        'tamanho', pp.tamanho,
        'quantidade', pp.quantidade,
        'largura', pp.largura,
        'altura', pp.altura
      ))
      FROM pedido_produtos pp
      WHERE pp.pedido_id = p.id),
      '[]'::jsonb
    ) as produtos_lista,
    -- Soldagem
    (os.id IS NOT NULL) as soldagem_existe,
    os.status as soldagem_status,
    (os.responsavel_id IS NOT NULL) as soldagem_capturada,
    aus.nome as soldagem_capturada_por_foto,
    COALESCE(os.pausada, false) as soldagem_pausada,
    os.justificativa_pausa as soldagem_justificativa_pausa,
    os.id as soldagem_ordem_id,
    os.numero_ordem as soldagem_numero_ordem,
    -- Perfiladeira
    (oper.id IS NOT NULL) as perfiladeira_existe,
    oper.status as perfiladeira_status,
    (oper.responsavel_id IS NOT NULL) as perfiladeira_capturada,
    auper.nome as perfiladeira_capturada_por_foto,
    COALESCE(oper.pausada, false) as perfiladeira_pausada,
    oper.justificativa_pausa as perfiladeira_justificativa_pausa,
    oper.id as perfiladeira_ordem_id,
    oper.numero_ordem as perfiladeira_numero_ordem,
    -- Separação
    (osep.id IS NOT NULL) as separacao_existe,
    osep.status as separacao_status,
    (osep.responsavel_id IS NOT NULL) as separacao_capturada,
    ausep.nome as separacao_capturada_por_foto,
    COALESCE(osep.pausada, false) as separacao_pausada,
    osep.justificativa_pausa as separacao_justificativa_pausa,
    osep.id as separacao_ordem_id,
    osep.numero_ordem as separacao_numero_ordem,
    -- Qualidade
    (oq.id IS NOT NULL) as qualidade_existe,
    oq.status as qualidade_status,
    (oq.responsavel_id IS NOT NULL) as qualidade_capturada,
    auq.nome as qualidade_capturada_por_foto,
    COALESCE(oq.pausada, false) as qualidade_pausada,
    oq.justificativa_pausa as qualidade_justificativa_pausa,
    oq.id as qualidade_ordem_id,
    oq.numero_ordem as qualidade_numero_ordem,
    -- Pintura (sem colunas de pausa na tabela)
    (opin.id IS NOT NULL) as pintura_existe,
    opin.status as pintura_status,
    (opin.responsavel_id IS NOT NULL) as pintura_capturada,
    aupin.nome as pintura_capturada_por_foto,
    false as pintura_pausada,
    NULL::text as pintura_justificativa_pausa,
    opin.id as pintura_ordem_id,
    opin.numero_ordem as pintura_numero_ordem
  FROM pedidos_producao p
  LEFT JOIN ordens_soldagem os ON os.pedido_id = p.id
  LEFT JOIN admin_users aus ON os.responsavel_id = aus.user_id
  LEFT JOIN ordens_perfiladeira oper ON oper.pedido_id = p.id
  LEFT JOIN admin_users auper ON oper.responsavel_id = auper.user_id
  LEFT JOIN ordens_separacao osep ON osep.pedido_id = p.id
  LEFT JOIN admin_users ausep ON osep.responsavel_id = ausep.user_id
  LEFT JOIN ordens_qualidade oq ON oq.pedido_id = p.id
  LEFT JOIN admin_users auq ON oq.responsavel_id = auq.user_id
  LEFT JOIN ordens_pintura opin ON opin.pedido_id = p.id
  LEFT JOIN admin_users aupin ON opin.responsavel_id = aupin.user_id
  WHERE p.etapa_atual = 'em_producao'
  ORDER BY p.prioridade_etapa ASC, p.data_entrega ASC NULLS LAST;
END;
$$;