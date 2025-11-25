-- Atualizar função com todas as dependências
CREATE OR REPLACE FUNCTION public.excluir_pedido_em_aberto(pedido_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  etapa_atual_pedido TEXT;
BEGIN
  -- Verificar se o pedido existe
  SELECT etapa_atual INTO etapa_atual_pedido
  FROM pedidos_producao
  WHERE id = pedido_uuid;

  IF etapa_atual_pedido IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Permitir exclusão apenas em "em_aberto" ou "finalizado"
  IF etapa_atual_pedido NOT IN ('em_aberto', 'finalizado') THEN
    RAISE EXCEPTION 'Somente pedidos nas etapas "Em Aberto" ou "Finalizado" podem ser excluídos. Etapa atual: %', etapa_atual_pedido;
  END IF;

  -- Para pedidos em_aberto: verificar se não há dependências críticas
  IF etapa_atual_pedido = 'em_aberto' THEN
    IF EXISTS (SELECT 1 FROM ordens_carregamento WHERE pedido_id = pedido_uuid) THEN
      RAISE EXCEPTION 'Pedido possui ordens de carregamento associadas e não pode ser excluído';
    END IF;
  END IF;

  -- Excluir TODAS as dependências (ordem importa por causa de FKs)
  
  -- 1. Excluir linhas de ordens primeiro
  DELETE FROM linhas_ordens WHERE pedido_id = pedido_uuid;
  
  -- 2. Excluir ordens de produção
  DELETE FROM ordens_soldagem WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_perfiladeira WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_separacao WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_qualidade WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_pintura WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_instalacao WHERE pedido_id = pedido_uuid;
  
  -- 3. Excluir ordens de carregamento
  DELETE FROM ordens_carregamento WHERE pedido_id = pedido_uuid;
  
  -- 4. Excluir instalações
  DELETE FROM instalacoes WHERE pedido_id = pedido_uuid;
  
  -- 5. Excluir instalações cadastradas
  DELETE FROM instalacoes_cadastradas WHERE pedido_id = pedido_uuid;
  
  -- 6. Excluir entregas
  DELETE FROM entregas WHERE pedido_id = pedido_uuid;
  
  -- 7. Excluir movimentações do pedido
  DELETE FROM pedidos_movimentacoes WHERE pedido_id = pedido_uuid;
  
  -- 8. Excluir etapas do pedido
  DELETE FROM pedidos_etapas WHERE pedido_id = pedido_uuid;
  
  -- 9. Excluir linhas do pedido
  DELETE FROM pedido_linhas WHERE pedido_id = pedido_uuid;

  -- 10. Finalmente excluir o pedido
  DELETE FROM pedidos_producao WHERE id = pedido_uuid;

  RETURN TRUE;
END;
$$;