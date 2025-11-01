-- Verificar e adicionar coluna pedido_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instalacoes_cadastradas' 
    AND column_name = 'pedido_id'
  ) THEN
    ALTER TABLE public.instalacoes_cadastradas
    ADD COLUMN pedido_id uuid REFERENCES public.pedidos_producao(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_instalacoes_pedido_id ON public.instalacoes_cadastradas(pedido_id);
  END IF;
END $$;

-- Criar função e trigger para criar logística ao avançar pedido
CREATE OR REPLACE FUNCTION public.criar_logistica_ao_avancar_producao()
RETURNS TRIGGER AS $$
DECLARE
  venda_record RECORD;
BEGIN
  -- Only trigger when advancing to 'em_producao' for the first time
  IF NEW.etapa_atual = 'em_producao' AND (OLD.etapa_atual IS NULL OR OLD.etapa_atual = 'aberto') THEN
    
    -- Get venda data
    SELECT * INTO venda_record
    FROM public.vendas
    WHERE id = NEW.venda_id;

    -- Create instalacao if tipo_entrega is 'instalacao'
    IF venda_record.tipo_entrega = 'instalacao' THEN
      INSERT INTO public.instalacoes_cadastradas (
        venda_id,
        pedido_id,
        nome_cliente,
        telefone_cliente,
        cidade,
        estado,
        endereco,
        cep,
        categoria,
        status,
        tipo_instalacao,
        created_by
      ) VALUES (
        venda_record.id,
        NEW.id,
        venda_record.cliente_nome,
        venda_record.cliente_telefone,
        venda_record.cidade,
        venda_record.estado,
        venda_record.endereco,
        venda_record.cep,
        'instalacao',
        'em_producao',
        'elisa',
        venda_record.atendente_id
      );
    
    -- Create entrega if tipo_entrega is 'entrega'
    ELSIF venda_record.tipo_entrega = 'entrega' THEN
      INSERT INTO public.entregas (
        venda_id,
        pedido_id,
        cliente_nome,
        cliente_telefone,
        cidade,
        estado,
        endereco,
        cep,
        status,
        created_by
      ) VALUES (
        venda_record.id,
        NEW.id,
        venda_record.cliente_nome,
        venda_record.cliente_telefone,
        venda_record.cidade,
        venda_record.estado,
        venda_record.endereco,
        venda_record.cep,
        'pendente',
        venda_record.atendente_id
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS criar_logistica_ao_avancar_trigger ON public.pedidos_producao;

CREATE TRIGGER criar_logistica_ao_avancar_trigger
AFTER UPDATE OF etapa_atual ON public.pedidos_producao
FOR EACH ROW
EXECUTE FUNCTION public.criar_logistica_ao_avancar_producao();

-- Inserir tabs de Logística
INSERT INTO public.app_tabs (key, label, permission, sort_order, tab_group, href)
VALUES ('logistica_group', 'Logística', NULL, 60, 'sidebar', '/dashboard/logistica')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  href = EXCLUDED.href,
  active = true;

INSERT INTO public.app_tabs (key, label, permission, sort_order, tab_group, parent_key, href)
VALUES ('logistica_home', 'Home', NULL, 1, 'sidebar', 'logistica_group', '/dashboard/logistica')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  href = EXCLUDED.href,
  active = true;

INSERT INTO public.app_tabs (key, label, permission, sort_order, tab_group, parent_key, href)
VALUES ('logistica_entregas', 'Entregas', NULL, 2, 'sidebar', 'logistica_group', '/dashboard/entregas')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  href = EXCLUDED.href,
  active = true;

-- Atualizar tab instalacoes para ficar sob logistica_group
UPDATE public.app_tabs
SET parent_key = 'logistica_group', 
    sort_order = 3,
    active = true
WHERE key = 'instalacoes';