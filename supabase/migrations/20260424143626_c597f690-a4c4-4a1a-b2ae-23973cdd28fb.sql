ALTER TABLE public.produtos_vendas
  ALTER COLUMN desconto_percentual TYPE numeric(6,2) USING desconto_percentual::numeric(6,2);