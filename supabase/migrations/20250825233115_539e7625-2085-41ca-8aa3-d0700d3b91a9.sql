-- Ajustar a lógica de cálculo do lucro para excluir o frete
-- O frete não deve ser considerado como lucro, apenas como repasse de custo

ALTER TABLE public.vendas 
DROP COLUMN IF EXISTS lucro_total;

-- Recriar a coluna lucro_total sem incluir valor_frete
ALTER TABLE public.vendas 
ADD COLUMN lucro_total numeric GENERATED ALWAYS AS (
  (valor_produto + valor_pintura + valor_instalacao) - (custo_produto + custo_pintura)
) STORED;