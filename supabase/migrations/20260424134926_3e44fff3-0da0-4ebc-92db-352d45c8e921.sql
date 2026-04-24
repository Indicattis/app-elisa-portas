-- Ajustar valor_produto para itens decimais migrados:
-- Para os itens onde foi feito backfill (quantidade=1, tamanho numérico preenchido),
-- multiplica valor_produto por tamanho para preservar o valor_total original.
UPDATE public.produtos_vendas pv
SET valor_produto = pv.valor_produto * (pv.tamanho)::numeric
FROM public.vendas_catalogo vc
WHERE pv.vendas_catalogo_id = vc.id
  AND lower(vc.unidade) IN ('metro', 'kg', 'litro')
  AND pv.quantidade = 1
  AND pv.tamanho ~ '^[0-9]+(\.[0-9]+)?$'
  AND (pv.tamanho)::numeric > 0;

-- Caso específico da venda be506f39…: valor original era 11/m, total 1174.80.
-- Com qty=20 e tamanho=5.34, valor_produto deve ser 11 * 5.34 = 58.74.
UPDATE public.produtos_vendas
SET valor_produto = 58.74
WHERE id = 'cb119f1f-2cc5-425c-9aba-a0295fd9daaa';