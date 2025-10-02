-- 1. Adicionar novos campos à tabela portas_vendas para suportar diferentes tipos de produtos
ALTER TABLE public.portas_vendas
ADD COLUMN IF NOT EXISTS tipo_produto text NOT NULL DEFAULT 'porta',
ADD COLUMN IF NOT EXISTS acessorio_id uuid REFERENCES public.acessorios(id),
ADD COLUMN IF NOT EXISTS adicional_id uuid REFERENCES public.adicionais(id),
ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_desconto text DEFAULT 'percentual',
ADD COLUMN IF NOT EXISTS quantidade integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS descricao text;

-- 2. Adicionar check constraint para tipo_produto
ALTER TABLE public.portas_vendas
ADD CONSTRAINT check_tipo_produto 
CHECK (tipo_produto IN ('porta', 'acessorio', 'adicional'));

-- 3. Adicionar check constraint para tipo_desconto
ALTER TABLE public.portas_vendas
ADD CONSTRAINT check_tipo_desconto 
CHECK (tipo_desconto IN ('percentual', 'valor'));

-- 4. Atualizar função de cálculo para suportar desconto em valor e diferentes tipos de produtos
CREATE OR REPLACE FUNCTION public.calcular_valores_porta()
RETURNS TRIGGER AS $$
DECLARE
  valor_base numeric;
  desconto_aplicado numeric;
BEGIN
  -- Calcular valor base antes do desconto
  valor_base := (
    NEW.valor_produto + NEW.valor_pintura + NEW.valor_instalacao
  ) * NEW.quantidade;
  
  -- Aplicar desconto conforme o tipo
  IF NEW.tipo_desconto = 'valor' THEN
    desconto_aplicado := COALESCE(NEW.desconto_valor, 0);
  ELSE
    desconto_aplicado := valor_base * (COALESCE(NEW.desconto_percentual, 0)::numeric / 100);
  END IF;
  
  NEW.valor_total_sem_frete := valor_base - desconto_aplicado;
  NEW.valor_total := NEW.valor_total_sem_frete + (NEW.valor_frete * NEW.quantidade);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Comentários para documentação
COMMENT ON COLUMN public.portas_vendas.tipo_produto IS 'Tipo do produto: porta, acessorio ou adicional';
COMMENT ON COLUMN public.portas_vendas.acessorio_id IS 'Referência ao acessório se tipo_produto = acessorio';
COMMENT ON COLUMN public.portas_vendas.adicional_id IS 'Referência ao adicional se tipo_produto = adicional';
COMMENT ON COLUMN public.portas_vendas.tipo_desconto IS 'Tipo de desconto: percentual ou valor';
COMMENT ON COLUMN public.portas_vendas.desconto_valor IS 'Valor do desconto em reais (usado quando tipo_desconto = valor)';
COMMENT ON COLUMN public.portas_vendas.quantidade IS 'Quantidade do produto';
COMMENT ON COLUMN public.portas_vendas.descricao IS 'Descrição adicional do produto';