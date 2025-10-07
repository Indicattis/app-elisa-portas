-- Adicionar colunas de lucro (inseridas manualmente) e custos/margens (calculadas automaticamente)
ALTER TABLE portas_vendas 
ADD COLUMN IF NOT EXISTS lucro_produto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lucro_pintura NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_produto NUMERIC GENERATED ALWAYS AS (valor_produto - COALESCE(lucro_produto, 0)) STORED,
ADD COLUMN IF NOT EXISTS custo_pintura NUMERIC GENERATED ALWAYS AS (valor_pintura - COALESCE(lucro_pintura, 0)) STORED,
ADD COLUMN IF NOT EXISTS margem_produto NUMERIC GENERATED ALWAYS AS (
  CASE WHEN valor_produto > 0 THEN (COALESCE(lucro_produto, 0) / valor_produto) * 100 ELSE 0 END
) STORED,
ADD COLUMN IF NOT EXISTS margem_pintura NUMERIC GENERATED ALWAYS AS (
  CASE WHEN valor_pintura > 0 THEN (COALESCE(lucro_pintura, 0) / valor_pintura) * 100 ELSE 0 END
) STORED;

-- Adicionar constraints de validação
ALTER TABLE portas_vendas 
ADD CONSTRAINT check_lucro_produto_valido CHECK (lucro_produto <= valor_produto AND lucro_produto >= 0),
ADD CONSTRAINT check_lucro_pintura_valido CHECK (lucro_pintura <= valor_pintura AND lucro_pintura >= 0);

-- Atualizar função de recálculo de totais da venda para incluir custos e lucros dos itens
CREATE OR REPLACE FUNCTION public.recalcular_totais_venda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  venda_uuid uuid;
BEGIN
  -- Pegar o venda_id correto
  IF TG_OP = 'DELETE' THEN
    venda_uuid := OLD.venda_id;
  ELSE
    venda_uuid := NEW.venda_id;
  END IF;
  
  -- Atualizar totais da venda incluindo custos e lucros
  UPDATE public.vendas v
  SET 
    valor_produto = COALESCE((
      SELECT SUM(valor_produto) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_pintura = COALESCE((
      SELECT SUM(valor_pintura) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_frete = COALESCE((
      SELECT SUM(valor_frete) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_instalacao = COALESCE((
      SELECT SUM(valor_instalacao) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_venda = COALESCE((
      SELECT SUM(valor_total) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    custo_produto = COALESCE((
      SELECT SUM(custo_produto) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    custo_pintura = COALESCE((
      SELECT SUM(custo_pintura) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    lucro_produto = COALESCE((
      SELECT SUM(lucro_produto) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    lucro_pintura = COALESCE((
      SELECT SUM(lucro_pintura) 
      FROM public.portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0)
  WHERE id = venda_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;