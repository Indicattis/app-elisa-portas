-- Atualizar função para incluir foto do responsável que capturou a ordem
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
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_soldagem WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada_por_foto', (
          SELECT au.foto_perfil_url 
          FROM ordens_soldagem os
          JOIN admin_users au ON os.responsavel_id = au.user_id
          WHERE os.pedido_id = pp.id AND os.historico = false 
          LIMIT 1
        )
      ),
      'perfiladeira', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_perfiladeira WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada_por_foto', (
          SELECT au.foto_perfil_url 
          FROM ordens_perfiladeira op
          JOIN admin_users au ON op.responsavel_id = au.user_id
          WHERE op.pedido_id = pp.id AND op.historico = false 
          LIMIT 1
        )
      ),
      'separacao', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_separacao WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada_por_foto', (
          SELECT au.foto_perfil_url 
          FROM ordens_separacao ose
          JOIN admin_users au ON ose.responsavel_id = au.user_id
          WHERE ose.pedido_id = pp.id AND ose.historico = false 
          LIMIT 1
        )
      ),
      'qualidade', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_qualidade WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada_por_foto', (
          SELECT au.foto_perfil_url 
          FROM ordens_qualidade oq
          JOIN admin_users au ON oq.responsavel_id = au.user_id
          WHERE oq.pedido_id = pp.id AND oq.historico = false 
          LIMIT 1
        )
      ),
      'pintura', jsonb_build_object(
        'existe', EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false),
        'status', (SELECT status FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada', (SELECT responsavel_id IS NOT NULL FROM ordens_pintura WHERE pedido_id = pp.id AND historico = false LIMIT 1),
        'capturada_por_foto', (
          SELECT au.foto_perfil_url 
          FROM ordens_pintura opt
          JOIN admin_users au ON opt.responsavel_id = au.user_id
          WHERE opt.pedido_id = pp.id AND opt.historico = false 
          LIMIT 1
        )
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