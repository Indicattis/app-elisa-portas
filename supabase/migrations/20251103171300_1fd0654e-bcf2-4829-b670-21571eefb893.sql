-- Corrigir função criar_logistica_ao_avancar_producao removendo referência à coluna categoria
CREATE OR REPLACE FUNCTION public.criar_logistica_ao_avancar_producao()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
        'em_producao',
        'elisa',
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
    
    -- Create entrega if tipo_entrega is 'entrega'
    ELSIF venda_record.tipo_entrega = 'entrega' THEN
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
        'em_producao',
        venda_record.atendente_id,
        venda_record.data_prevista_entrega
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;