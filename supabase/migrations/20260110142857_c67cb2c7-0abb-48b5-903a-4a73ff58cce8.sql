-- Drop and recreate function using the correct separate order tables
DROP FUNCTION IF EXISTS public.get_pedidos_com_status_ordens();

CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_ordens()
RETURNS TABLE (
  numero_pedido text,
  numero_mes integer,
  etapa_atual text,
  nome_cliente text,
  data_entrega date,
  data_carregamento date,
  prioridade integer,
  soldagem_existe boolean,
  soldagem_status text,
  soldagem_capturada boolean,
  soldagem_capturada_por_foto text,
  perfiladeira_existe boolean,
  perfiladeira_status text,
  perfiladeira_capturada boolean,
  perfiladeira_capturada_por_foto text,
  separacao_existe boolean,
  separacao_status text,
  separacao_capturada boolean,
  separacao_capturada_por_foto text,
  qualidade_existe boolean,
  qualidade_status text,
  qualidade_capturada boolean,
  qualidade_capturada_por_foto text,
  pintura_existe boolean,
  pintura_status text,
  pintura_capturada boolean,
  pintura_capturada_por_foto text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.numero_pedido::text,
    pp.numero_mes,
    pp.etapa_atual::text,
    pp.cliente_nome::text as nome_cliente,
    pp.data_entrega,
    pp.data_carregamento,
    COALESCE(pp.prioridade_etapa, 999),
    -- Soldagem (from ordens_soldagem table)
    EXISTS(SELECT 1 FROM ordens_soldagem os WHERE os.pedido_id = pp.id) as soldagem_existe,
    (SELECT os.status FROM ordens_soldagem os WHERE os.pedido_id = pp.id LIMIT 1)::text as soldagem_status,
    COALESCE((SELECT os.responsavel_id IS NOT NULL FROM ordens_soldagem os WHERE os.pedido_id = pp.id LIMIT 1), false) as soldagem_capturada,
    NULL::text as soldagem_capturada_por_foto,
    -- Perfiladeira (from ordens_perfiladeira table)
    EXISTS(SELECT 1 FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id) as perfiladeira_existe,
    (SELECT op.status FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1)::text as perfiladeira_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1), false) as perfiladeira_capturada,
    NULL::text as perfiladeira_capturada_por_foto,
    -- Separação (from ordens_separacao table)
    EXISTS(SELECT 1 FROM ordens_separacao os WHERE os.pedido_id = pp.id) as separacao_existe,
    (SELECT os.status FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1)::text as separacao_status,
    COALESCE((SELECT os.responsavel_id IS NOT NULL FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1), false) as separacao_capturada,
    NULL::text as separacao_capturada_por_foto,
    -- Qualidade (from ordens_qualidade table)
    EXISTS(SELECT 1 FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id) as qualidade_existe,
    (SELECT oq.status FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1)::text as qualidade_status,
    COALESCE((SELECT oq.responsavel_id IS NOT NULL FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1), false) as qualidade_capturada,
    NULL::text as qualidade_capturada_por_foto,
    -- Pintura (from ordens_pintura table)
    EXISTS(SELECT 1 FROM ordens_pintura opi WHERE opi.pedido_id = pp.id) as pintura_existe,
    (SELECT opi.status FROM ordens_pintura opi WHERE opi.pedido_id = pp.id LIMIT 1)::text as pintura_status,
    COALESCE((SELECT opi.responsavel_id IS NOT NULL FROM ordens_pintura opi WHERE opi.pedido_id = pp.id LIMIT 1), false) as pintura_capturada,
    NULL::text as pintura_capturada_por_foto
  FROM pedidos_producao pp
  WHERE pp.etapa_atual IN ('em_producao', 'inspecao_qualidade', 'pintura', 'aguardando_instalacao')
  ORDER BY COALESCE(pp.prioridade_etapa, 999) ASC, pp.data_carregamento ASC NULLS LAST, pp.created_at ASC;
END;
$$;