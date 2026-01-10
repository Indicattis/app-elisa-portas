
CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_ordens()
 RETURNS TABLE(numero_pedido text, numero_mes integer, etapa_atual text, nome_cliente text, data_entrega date, data_carregamento date, prioridade integer, soldagem_existe boolean, soldagem_status text, soldagem_capturada boolean, soldagem_capturada_por_foto text, perfiladeira_existe boolean, perfiladeira_status text, perfiladeira_capturada boolean, perfiladeira_capturada_por_foto text, separacao_existe boolean, separacao_status text, separacao_capturada boolean, separacao_capturada_por_foto text, qualidade_existe boolean, qualidade_status text, qualidade_capturada boolean, qualidade_capturada_por_foto text, pintura_existe boolean, pintura_status text, pintura_capturada boolean, pintura_capturada_por_foto text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pp.numero_pedido,
    pp.numero_mes,
    pp.etapa_atual,
    COALESCE(c.nome, 'Cliente não informado')::text as nome_cliente,
    pp.data_entrega,
    pp.data_carregamento,
    COALESCE(pp.prioridade_etapa, 999) as prioridade,
    -- Soldagem
    COALESCE((SELECT true FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'soldagem' LIMIT 1), false) as soldagem_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'soldagem' LIMIT 1) as soldagem_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'soldagem' LIMIT 1), false) as soldagem_capturada,
    (SELECT au.foto_perfil_url FROM ordens_producao op LEFT JOIN admin_users au ON au.user_id = op.responsavel_id WHERE op.pedido_id = pp.id AND op.tipo = 'soldagem' LIMIT 1) as soldagem_capturada_por_foto,
    -- Perfiladeira
    COALESCE((SELECT true FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'perfiladeira' LIMIT 1), false) as perfiladeira_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'perfiladeira' LIMIT 1) as perfiladeira_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'perfiladeira' LIMIT 1), false) as perfiladeira_capturada,
    (SELECT au.foto_perfil_url FROM ordens_producao op LEFT JOIN admin_users au ON au.user_id = op.responsavel_id WHERE op.pedido_id = pp.id AND op.tipo = 'perfiladeira' LIMIT 1) as perfiladeira_capturada_por_foto,
    -- Separação
    COALESCE((SELECT true FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'separacao' LIMIT 1), false) as separacao_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'separacao' LIMIT 1) as separacao_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'separacao' LIMIT 1), false) as separacao_capturada,
    (SELECT au.foto_perfil_url FROM ordens_producao op LEFT JOIN admin_users au ON au.user_id = op.responsavel_id WHERE op.pedido_id = pp.id AND op.tipo = 'separacao' LIMIT 1) as separacao_capturada_por_foto,
    -- Qualidade
    COALESCE((SELECT true FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'qualidade' LIMIT 1), false) as qualidade_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'qualidade' LIMIT 1) as qualidade_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'qualidade' LIMIT 1), false) as qualidade_capturada,
    (SELECT au.foto_perfil_url FROM ordens_producao op LEFT JOIN admin_users au ON au.user_id = op.responsavel_id WHERE op.pedido_id = pp.id AND op.tipo = 'qualidade' LIMIT 1) as qualidade_capturada_por_foto,
    -- Pintura
    COALESCE((SELECT true FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'pintura' LIMIT 1), false) as pintura_existe,
    (SELECT op.status FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'pintura' LIMIT 1) as pintura_status,
    COALESCE((SELECT op.responsavel_id IS NOT NULL FROM ordens_producao op WHERE op.pedido_id = pp.id AND op.tipo = 'pintura' LIMIT 1), false) as pintura_capturada,
    (SELECT au.foto_perfil_url FROM ordens_producao op LEFT JOIN admin_users au ON au.user_id = op.responsavel_id WHERE op.pedido_id = pp.id AND op.tipo = 'pintura' LIMIT 1) as pintura_capturada_por_foto
  FROM pedidos_producao pp
  LEFT JOIN vendas v ON v.id = pp.venda_id
  LEFT JOIN clientes c ON c.id = v.cliente_id
  WHERE pp.etapa_atual IN ('em_producao', 'inspecao_qualidade', 'pintura', 'aguardando_instalacao')
    AND pp.arquivado = false
    AND EXISTS (
      SELECT 1 FROM ordens_producao op 
      WHERE op.pedido_id = pp.id 
      AND op.status != 'concluida'
    )
  ORDER BY COALESCE(pp.prioridade_etapa, 999) ASC, pp.created_at ASC;
END;
$function$;
