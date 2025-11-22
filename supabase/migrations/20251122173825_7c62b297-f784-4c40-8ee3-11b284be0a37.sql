-- Função para ranking de materiais por quantidade
CREATE OR REPLACE FUNCTION public.get_materiais_ranking_quantidade()
RETURNS TABLE (
  item text,
  total_quantidade numeric,
  ocorrencias bigint
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    lo.item,
    SUM(lo.quantidade) as total_quantidade,
    COUNT(*) as ocorrencias
  FROM linhas_ordens lo
  WHERE lo.concluida = true
    AND lo.concluida_em >= CURRENT_DATE
  GROUP BY lo.item
  ORDER BY total_quantidade DESC
  LIMIT 10;
$$;

-- Função para ranking de materiais por metragem
CREATE OR REPLACE FUNCTION public.get_materiais_ranking_metragem()
RETURNS TABLE (
  item text,
  metragem_m2 numeric
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    lo.item,
    SUM(lo.largura * lo.altura * lo.quantidade / 1000000) as metragem_m2
  FROM linhas_ordens lo
  WHERE lo.concluida = true
    AND lo.concluida_em >= CURRENT_DATE
    AND lo.largura IS NOT NULL
    AND lo.altura IS NOT NULL
  GROUP BY lo.item
  ORDER BY metragem_m2 DESC
  LIMIT 10;
$$;

-- Função para obter pedidos com status de ordens
CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_ordens()
RETURNS TABLE (
  numero_pedido text,
  etapa_atual text,
  ordens jsonb
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pp.numero_pedido,
    pp.etapa_atual,
    jsonb_build_object(
      'soldagem', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_soldagem WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_soldagem WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_soldagem WHERE pedido_id = pp.id AND historico = false LIMIT 1)
      ),
      'perfiladeira', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false LIMIT 1)
      ),
      'separacao', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false LIMIT 1)
      ),
      'qualidade', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false LIMIT 1)
      ),
      'pintura', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false LIMIT 1)
      )
    ) as ordens
  FROM pedidos_producao pp
  WHERE pp.status != 'concluido'
  ORDER BY pp.numero_pedido DESC;
$$;

-- Função para contar portas de enrolar produzidas hoje
CREATE OR REPLACE FUNCTION public.get_portas_enrolar_produzidas_hoje()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(SUM(pv.quantidade)::integer, 0) as total_portas
  FROM produtos_vendas pv
  JOIN vendas v ON pv.venda_id = v.id
  JOIN pedidos_producao pp ON v.id = pp.venda_id
  WHERE pv.tipo_produto = 'porta_enrolar'
    AND pp.status = 'concluido'
    AND pp.updated_at::date = CURRENT_DATE;
$$;