-- Drop and recreate function to include pause information
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
    COALESCE((SELECT os.pausada FROM ordens_soldagem os WHERE os.pedido_id = pp.id LIMIT 1), false) as soldagem_pausada,
    (SELECT os.justificativa_pausa FROM ordens_soldagem os WHERE os.pedido_id = pp.id LIMIT 1)::text as soldagem_justificativa_pausa,
    -- Perfiladeira (from ordens_perfiladeira table)
    EXISTS(SELECT 1 FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id) as perfiladeira_existe,
    (SELECT op.status FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1)::text as perfiladeira_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1), false) as perfiladeira_capturada,
    NULL::text as perfiladeira_capturada_por_foto,
    COALESCE((SELECT op.pausada FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1), false) as perfiladeira_pausada,
    (SELECT op.justificativa_pausa FROM ordens_perfiladeira op WHERE op.pedido_id = pp.id LIMIT 1)::text as perfiladeira_justificativa_pausa,
    -- Separação (from ordens_separacao table)
    EXISTS(SELECT 1 FROM ordens_separacao os WHERE os.pedido_id = pp.id) as separacao_existe,
    (SELECT os.status FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1)::text as separacao_status,
    COALESCE((SELECT os.responsavel_id IS NOT NULL FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1), false) as separacao_capturada,
    NULL::text as separacao_capturada_por_foto,
    COALESCE((SELECT os.pausada FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1), false) as separacao_pausada,
    (SELECT os.justificativa_pausa FROM ordens_separacao os WHERE os.pedido_id = pp.id LIMIT 1)::text as separacao_justificativa_pausa,
    -- Qualidade (from ordens_qualidade table)
    EXISTS(SELECT 1 FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id) as qualidade_existe,
    (SELECT oq.status FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1)::text as qualidade_status,
    COALESCE((SELECT oq.responsavel_id IS NOT NULL FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1), false) as qualidade_capturada,
    NULL::text as qualidade_capturada_por_foto,
    COALESCE((SELECT oq.pausada FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1), false) as qualidade_pausada,
    (SELECT oq.justificativa_pausa FROM ordens_qualidade oq WHERE oq.pedido_id = pp.id LIMIT 1)::text as qualidade_justificativa_pausa,
    -- Pintura (from ordens_pintura table - no pause columns)
    EXISTS(SELECT 1 FROM ordens_pintura opi WHERE opi.pedido_id = pp.id) as pintura_existe,
    (SELECT opi.status FROM ordens_pintura opi WHERE opi.pedido_id = pp.id LIMIT 1)::text as pintura_status,
    COALESCE((SELECT opi.responsavel_id IS NOT NULL FROM ordens_pintura opi WHERE opi.pedido_id = pp.id LIMIT 1), false) as pintura_capturada,
    NULL::text as pintura_capturada_por_foto,
    false as pintura_pausada,
    NULL::text as pintura_justificativa_pausa
  FROM pedidos_producao pp
  WHERE pp.etapa_atual IN ('em_producao', 'inspecao_qualidade', 'pintura', 'aguardando_instalacao')
  ORDER BY COALESCE(pp.prioridade_etapa, 999) ASC, pp.data_carregamento ASC NULLS LAST, pp.created_at ASC;
END;
$$;