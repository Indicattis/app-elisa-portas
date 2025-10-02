-- 1. Criar tabela portas_vendas para armazenar portas individuais de cada venda
CREATE TABLE IF NOT EXISTS public.portas_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  tamanho text NOT NULL,
  cor_id uuid REFERENCES public.catalogo_cores(id),
  valor_produto numeric NOT NULL DEFAULT 0,
  valor_pintura numeric NOT NULL DEFAULT 0,
  valor_frete numeric NOT NULL DEFAULT 0,
  valor_instalacao numeric NOT NULL DEFAULT 0,
  desconto_percentual integer DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_total_sem_frete numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.portas_vendas ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem gerenciar portas
CREATE POLICY "Authenticated users can manage portas_vendas"
ON public.portas_vendas
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2. Trigger para calcular valores automáticos da porta
CREATE OR REPLACE FUNCTION public.calcular_valores_porta()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular valor com desconto
  NEW.valor_total_sem_frete := (
    NEW.valor_produto + NEW.valor_pintura + NEW.valor_instalacao
  ) * (1 - COALESCE(NEW.desconto_percentual, 0)::numeric / 100);
  
  NEW.valor_total := NEW.valor_total_sem_frete + NEW.valor_frete;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_valores_porta
BEFORE INSERT OR UPDATE ON public.portas_vendas
FOR EACH ROW
EXECUTE FUNCTION public.calcular_valores_porta();

-- 3. Trigger para atualizar updated_at em portas_vendas
CREATE TRIGGER trigger_portas_vendas_updated_at
BEFORE UPDATE ON public.portas_vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Trigger para recalcular totais da venda quando portas mudarem
CREATE OR REPLACE FUNCTION public.recalcular_totais_venda()
RETURNS TRIGGER AS $$
DECLARE
  venda_uuid uuid;
BEGIN
  -- Pegar o venda_id correto
  IF TG_OP = 'DELETE' THEN
    venda_uuid := OLD.venda_id;
  ELSE
    venda_uuid := NEW.venda_id;
  END IF;
  
  -- Atualizar totais da venda
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
    ), 0)
  WHERE id = venda_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_totais_venda
AFTER INSERT OR UPDATE OR DELETE ON public.portas_vendas
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_totais_venda();

-- 5. Trigger para inserir automaticamente no contador de vendas
CREATE OR REPLACE FUNCTION public.inserir_contador_vendas_automatico()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar contador de vendas
  INSERT INTO public.contador_vendas_dias (
    data,
    atendente_id,
    valor,
    numero_vendas,
    created_by
  )
  VALUES (
    DATE(NEW.data_venda),
    NEW.atendente_id,
    NEW.valor_venda,
    1,
    NEW.atendente_id
  )
  ON CONFLICT (data, atendente_id) 
  DO UPDATE SET
    valor = contador_vendas_dias.valor + EXCLUDED.valor,
    numero_vendas = contador_vendas_dias.numero_vendas + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inserir_contador_vendas
AFTER INSERT ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.inserir_contador_vendas_automatico();

-- 6. Trigger para criar instalação automaticamente
CREATE OR REPLACE FUNCTION public.criar_instalacao_automatica()
RETURNS TRIGGER AS $$
DECLARE
  tamanhos_portas text;
  quantidade_portas integer;
BEGIN
  -- Contar quantidade de portas
  SELECT COUNT(*)
  INTO quantidade_portas
  FROM public.portas_vendas
  WHERE venda_id = NEW.id;
  
  -- Concatenar quantidade e tamanhos das portas
  SELECT string_agg(tamanho, ', ')
  INTO tamanhos_portas
  FROM public.portas_vendas
  WHERE venda_id = NEW.id;
  
  -- Criar instalação apenas se tiver portas com instalação
  IF NEW.valor_instalacao > 0 THEN
    INSERT INTO public.instalacoes_cadastradas (
      nome_cliente,
      telefone_cliente,
      cidade,
      estado,
      categoria,
      tamanho,
      status,
      tipo_instalacao,
      created_by
    )
    VALUES (
      NEW.cliente_nome,
      NEW.cliente_telefone,
      NEW.cidade,
      NEW.estado,
      'instalacao',
      COALESCE(quantidade_portas || ' porta(s): ' || tamanhos_portas, 'Não especificado'),
      'pendente_producao',
      'elisa',
      NEW.atendente_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_instalacao
AFTER INSERT ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.criar_instalacao_automatica();

-- 7. Adicionar constraint unique em contador_vendas_dias se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contador_vendas_dias_data_atendente_key'
  ) THEN
    ALTER TABLE public.contador_vendas_dias 
    ADD CONSTRAINT contador_vendas_dias_data_atendente_key 
    UNIQUE (data, atendente_id);
  END IF;
END $$;