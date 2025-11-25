-- Função para excluir pedidos na etapa "Em Aberto" (exclui linhas associadas)
CREATE OR REPLACE FUNCTION public.excluir_pedido_em_aberto(pedido_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  etapa_atual_pedido TEXT;
BEGIN
  -- Verificar se o pedido existe e está na etapa "em_aberto"
  SELECT etapa_atual INTO etapa_atual_pedido
  FROM pedidos_producao
  WHERE id = pedido_uuid;

  IF etapa_atual_pedido IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  IF etapa_atual_pedido != 'em_aberto' THEN
    RAISE EXCEPTION 'Somente pedidos na etapa "Em Aberto" podem ser excluídos. Etapa atual: %', etapa_atual_pedido;
  END IF;

  -- Verificar se existem ordens de carregamento associadas
  IF EXISTS (SELECT 1 FROM ordens_carregamento WHERE pedido_id = pedido_uuid) THEN
    RAISE EXCEPTION 'Pedido possui ordens de carregamento associadas e não pode ser excluído';
  END IF;

  -- Verificar se existem instalações associadas
  IF EXISTS (SELECT 1 FROM instalacoes WHERE pedido_id = pedido_uuid) THEN
    RAISE EXCEPTION 'Pedido possui instalações associadas e não pode ser excluído';
  END IF;

  -- Verificar se existem entregas associadas
  IF EXISTS (SELECT 1 FROM entregas WHERE pedido_id = pedido_uuid) THEN
    RAISE EXCEPTION 'Pedido possui entregas associadas e não pode ser excluído';
  END IF;

  -- Excluir linhas de ordens associadas ao pedido
  DELETE FROM linhas_ordens WHERE pedido_id = pedido_uuid;

  -- Excluir o pedido
  DELETE FROM pedidos_producao WHERE id = pedido_uuid;

  RETURN TRUE;
END;
$$;