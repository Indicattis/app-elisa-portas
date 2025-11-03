-- Adicionar novos campos à tabela entregas
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS data_producao date;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS entrega_concluida boolean DEFAULT false;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS entrega_concluida_em timestamp with time zone;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS entrega_concluida_por uuid;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS responsavel_entrega_id uuid;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS responsavel_entrega_nome text;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS tamanho text;

-- Atualizar coluna status para refletir os mesmos valores das instalações
UPDATE entregas SET status = 'pendente_producao' WHERE status = 'pendente';

-- Criar função RPC para concluir entrega e avançar pedido
CREATE OR REPLACE FUNCTION concluir_entrega_e_avancar_pedido(p_entrega_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
  v_user_id uuid;
  v_etapa_id uuid;
BEGIN
  -- Obter user_id atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar pedido associado à entrega
  SELECT pedido_id INTO v_pedido_id
  FROM entregas
  WHERE id = p_entrega_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Entrega não possui pedido associado';
  END IF;

  -- Verificar etapa do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  IF v_etapa_atual != 'aguardando_coleta' THEN
    RAISE EXCEPTION 'Pedido deve estar em "Aguardando Coleta" para concluir entrega. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Marcar entrega como concluída
  UPDATE entregas
  SET entrega_concluida = true,
      entrega_concluida_em = now(),
      entrega_concluida_por = v_user_id,
      status = 'finalizada'
  WHERE id = p_entrega_id;

  -- Buscar etapa atual do pedido (aguardando_coleta)
  SELECT id INTO v_etapa_id
  FROM pedidos_etapas
  WHERE pedido_id = v_pedido_id 
    AND etapa = 'aguardando_coleta'
    AND data_saida IS NULL
  LIMIT 1;

  -- Fechar etapa atual
  IF v_etapa_id IS NOT NULL THEN
    UPDATE pedidos_etapas
    SET data_saida = now()
    WHERE id = v_etapa_id;
  END IF;

  -- Criar nova etapa 'finalizado'
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
  VALUES (v_pedido_id, 'finalizado', '[]'::jsonb, now());

  -- Avançar pedido para "Finalizado"
  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado',
      status = 'concluido',
      prioridade_etapa = 0,
      updated_at = now()
  WHERE id = v_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'entrega_id', p_entrega_id
  );
END;
$$;

-- Criar função para sincronizar status de entregas com etapa do pedido
CREATE OR REPLACE FUNCTION sync_entrega_status_from_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mapear etapas do pedido para status da entrega
  IF NEW.etapa_atual IN ('aberto', 'perfiladeira', 'separacao', 'soldagem') THEN
    UPDATE entregas SET status = 'em_producao' WHERE pedido_id = NEW.id;
  ELSIF NEW.etapa_atual = 'qualidade' THEN
    UPDATE entregas SET status = 'em_qualidade' WHERE pedido_id = NEW.id;
  ELSIF NEW.etapa_atual = 'pintura' THEN
    UPDATE entregas SET status = 'aguardando_pintura' WHERE pedido_id = NEW.id;
  ELSIF NEW.etapa_atual = 'aguardando_coleta' THEN
    UPDATE entregas SET status = 'pronta_fabrica' WHERE pedido_id = NEW.id;
  ELSIF NEW.etapa_atual = 'finalizado' THEN
    UPDATE entregas SET status = 'finalizada' WHERE pedido_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela pedidos_producao
DROP TRIGGER IF EXISTS trigger_sync_entrega_status ON pedidos_producao;
CREATE TRIGGER trigger_sync_entrega_status
AFTER UPDATE OF etapa_atual ON pedidos_producao
FOR EACH ROW
EXECUTE FUNCTION sync_entrega_status_from_pedido();