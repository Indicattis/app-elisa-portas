-- Atualizar função para exibir apenas pedidos com ordens pendentes
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
    AND (
      -- Apenas pedidos que tem pelo menos uma ordem pendente
      EXISTS(SELECT 1 FROM ordens_soldagem WHERE pedido_id = pp.id AND historico = false AND status = 'pendente')
      OR EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false AND status = 'pendente')
      OR EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false AND status = 'pendente')
      OR EXISTS(SELECT 1 FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false AND status = 'pendente')
      OR EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false AND status = 'pendente')
    )
  ORDER BY pp.numero_pedido DESC;
$$;