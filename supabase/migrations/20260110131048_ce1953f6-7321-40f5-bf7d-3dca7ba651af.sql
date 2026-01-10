-- Drop and recreate function with correct types
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.numero_pedido::text,
    pp.numero_mes,
    pp.etapa_atual::text,
    pp.nome_cliente::text,
    pp.data_entrega,
    pp.data_carregamento,
    COALESCE(pp.prioridade_etapa, 999),
    -- Soldagem
    EXISTS(SELECT 1 FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'soldagem') as soldagem_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'soldagem' LIMIT 1)::text as soldagem_status,
    COALESCE((SELECT op.capturada FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'soldagem' LIMIT 1), false) as soldagem_capturada,
    (SELECT op.capturada_por_foto FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'soldagem' LIMIT 1)::text as soldagem_capturada_por_foto,
    -- Perfiladeira
    EXISTS(SELECT 1 FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'perfiladeira') as perfiladeira_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'perfiladeira' LIMIT 1)::text as perfiladeira_status,
    COALESCE((SELECT op.capturada FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'perfiladeira' LIMIT 1), false) as perfiladeira_capturada,
    (SELECT op.capturada_por_foto FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'perfiladeira' LIMIT 1)::text as perfiladeira_capturada_por_foto,
    -- Separação
    EXISTS(SELECT 1 FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'separacao') as separacao_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'separacao' LIMIT 1)::text as separacao_status,
    COALESCE((SELECT op.capturada FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'separacao' LIMIT 1), false) as separacao_capturada,
    (SELECT op.capturada_por_foto FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'separacao' LIMIT 1)::text as separacao_capturada_por_foto,
    -- Qualidade
    EXISTS(SELECT 1 FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'qualidade') as qualidade_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'qualidade' LIMIT 1)::text as qualidade_status,
    COALESCE((SELECT op.capturada FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'qualidade' LIMIT 1), false) as qualidade_capturada,
    (SELECT op.capturada_por_foto FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'qualidade' LIMIT 1)::text as qualidade_capturada_por_foto,
    -- Pintura
    EXISTS(SELECT 1 FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'pintura') as pintura_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'pintura' LIMIT 1)::text as pintura_status,
    COALESCE((SELECT op.capturada FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'pintura' LIMIT 1), false) as pintura_capturada,
    (SELECT op.capturada_por_foto FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo_ordem = 'pintura' LIMIT 1)::text as pintura_capturada_por_foto
  FROM pedidos_producao pp
  WHERE pp.etapa_atual IN ('em_producao', 'inspecao_qualidade', 'pintura', 'aguardando_instalacao')
  ORDER BY COALESCE(pp.prioridade_etapa, 999) ASC, pp.data_carregamento ASC NULLS LAST, pp.created_at ASC;
END;
$$;