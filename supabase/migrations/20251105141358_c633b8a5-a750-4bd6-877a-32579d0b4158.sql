-- Remover triggers de sincronização de status (não sincroniza mais com pedido)
DROP TRIGGER IF EXISTS sync_instalacao_status_from_pedido ON pedidos_producao;
DROP TRIGGER IF EXISTS sync_entrega_status_from_pedido ON pedidos_producao;

-- Remover trigger antiga que criava na etapa errada
DROP TRIGGER IF EXISTS criar_logistica_ao_avancar_producao ON pedidos_producao;

-- Criar função para criar instalação quando pedido chega em "aguardando_instalacao"
CREATE OR REPLACE FUNCTION criar_instalacao_ao_aguardar_instalacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  venda_record RECORD;
BEGIN
  -- Só cria se estiver entrando na etapa "aguardando_instalacao"
  IF NEW.etapa_atual = 'aguardando_instalacao' AND 
     (OLD.etapa_atual IS NULL OR OLD.etapa_atual != 'aguardando_instalacao') THEN
    
    -- Buscar dados da venda
    SELECT * INTO venda_record
    FROM public.vendas
    WHERE id = NEW.venda_id;

    -- Verificar se é tipo instalacao e se ainda não existe instalação
    IF venda_record.tipo_entrega = 'instalacao' AND 
       NOT EXISTS (SELECT 1 FROM instalacoes_cadastradas WHERE pedido_id = NEW.id) THEN
      
      INSERT INTO public.instalacoes_cadastradas (
        venda_id,
        pedido_id,
        nome_cliente,
        telefone_cliente,
        cidade,
        estado,
        status,
        tipo_instalacao,
        created_by,
        data_instalacao
      ) VALUES (
        venda_record.id,
        NEW.id,
        venda_record.cliente_nome,
        venda_record.cliente_telefone,
        venda_record.cidade,
        venda_record.estado,
        'pronta_fabrica', -- Status inicial: pronta para instalação
        'elisa',
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar função para criar entrega quando pedido chega em "aguardando_coleta"
CREATE OR REPLACE FUNCTION criar_entrega_ao_aguardar_coleta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  venda_record RECORD;
BEGIN
  -- Só cria se estiver entrando na etapa "aguardando_coleta"
  IF NEW.etapa_atual = 'aguardando_coleta' AND 
     (OLD.etapa_atual IS NULL OR OLD.etapa_atual != 'aguardando_coleta') THEN
    
    -- Buscar dados da venda
    SELECT * INTO venda_record
    FROM public.vendas
    WHERE id = NEW.venda_id;

    -- Verificar se é tipo entrega e se ainda não existe entrega
    IF venda_record.tipo_entrega = 'entrega' AND 
       NOT EXISTS (SELECT 1 FROM entregas WHERE pedido_id = NEW.id) THEN
      
      INSERT INTO public.entregas (
        venda_id,
        pedido_id,
        nome_cliente,
        telefone_cliente,
        cidade,
        estado,
        status,
        created_by,
        data_entrega
      ) VALUES (
        venda_record.id,
        NEW.id,
        venda_record.cliente_nome,
        venda_record.cliente_telefone,
        venda_record.cidade,
        venda_record.estado,
        'pronta_fabrica', -- Status inicial: pronta para coleta
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Adicionar triggers
CREATE TRIGGER trigger_criar_instalacao_ao_aguardar_instalacao
  AFTER UPDATE ON pedidos_producao
  FOR EACH ROW
  EXECUTE FUNCTION criar_instalacao_ao_aguardar_instalacao();

CREATE TRIGGER trigger_criar_entrega_ao_aguardar_coleta
  AFTER UPDATE ON pedidos_producao
  FOR EACH ROW
  EXECUTE FUNCTION criar_entrega_ao_aguardar_coleta();

-- Comentários
COMMENT ON FUNCTION criar_instalacao_ao_aguardar_instalacao() IS 'Cria instalação automaticamente quando pedido chega na etapa aguardando_instalacao';
COMMENT ON FUNCTION criar_entrega_ao_aguardar_coleta() IS 'Cria entrega automaticamente quando pedido chega na etapa aguardando_coleta';