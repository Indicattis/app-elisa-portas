-- Remover triggers antigos que criam instalação/entrega apenas em etapas avançadas
DROP TRIGGER IF EXISTS trigger_criar_instalacao_ao_aguardar_instalacao ON pedidos_producao;
DROP TRIGGER IF EXISTS trigger_criar_entrega_ao_aguardar_coleta ON pedidos_producao;

-- Criar trigger unificado para criar instalação/entrega ao entrar em "Em Produção"
CREATE OR REPLACE FUNCTION criar_logistica_ao_entrar_em_producao()
RETURNS TRIGGER AS $$
DECLARE
  venda_record RECORD;
BEGIN
  -- Só executa ao entrar na etapa 'em_producao' pela primeira vez
  IF NEW.etapa_atual = 'em_producao' AND 
     (OLD.etapa_atual IS NULL OR OLD.etapa_atual != 'em_producao') THEN
    
    -- Buscar dados da venda
    SELECT * INTO venda_record
    FROM vendas
    WHERE id = NEW.venda_id;
    
    IF venda_record.id IS NULL THEN
      RAISE LOG '[criar_logistica] Venda não encontrada para pedido: %', NEW.id;
      RETURN NEW;
    END IF;

    -- Criar INSTALAÇÃO se tipo_entrega = 'instalacao' e ainda não existe
    IF venda_record.tipo_entrega = 'instalacao' AND 
       NOT EXISTS (SELECT 1 FROM instalacoes_cadastradas WHERE pedido_id = NEW.id) THEN
      
      INSERT INTO instalacoes_cadastradas (
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
        'pendente_producao',
        'elisa',
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
      
      RAISE LOG '[criar_logistica] Instalação criada para pedido: % (venda: %)', NEW.id, venda_record.id;
    
    -- Criar ENTREGA se tipo_entrega = 'entrega' e ainda não existe
    ELSIF venda_record.tipo_entrega = 'entrega' AND 
          NOT EXISTS (SELECT 1 FROM entregas WHERE pedido_id = NEW.id) THEN
      
      INSERT INTO entregas (
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
        'pendente_producao',
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
      
      RAISE LOG '[criar_logistica] Entrega criada para pedido: % (venda: %)', NEW.id, venda_record.id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trigger_criar_logistica_em_producao
  AFTER UPDATE OF etapa_atual ON pedidos_producao
  FOR EACH ROW
  WHEN (NEW.etapa_atual = 'em_producao')
  EXECUTE FUNCTION criar_logistica_ao_entrar_em_producao();