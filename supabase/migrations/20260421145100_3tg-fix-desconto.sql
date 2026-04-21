-- Corrige a venda 3TG Serviços Ltda (ID 6d1c104d-f827-470b-80d2-b9417c5bffef)
-- Bug: o desconto total de R$ 65.509,89 foi replicado em cada uma das 12 portas.
-- Correção: ratear esse desconto entre as 12 portas (R$ 5.459,1575 cada).

UPDATE public.produtos_vendas
SET desconto_valor = 5459.1575,
    valor_total = (COALESCE(valor_produto,0) + COALESCE(valor_pintura,0) + COALESCE(valor_instalacao,0)) * COALESCE(quantidade,1) - 5459.1575,
    updated_at = now()
WHERE venda_id = '6d1c104d-f827-470b-80d2-b9417c5bffef'
  AND tipo_produto = 'porta_enrolar';

-- Recalcula o cabeçalho da venda com base na nova soma dos itens
UPDATE public.vendas v
SET valor_venda = sub.total_itens,
    valor_a_receber = GREATEST(sub.total_itens - COALESCE(v.valor_entrada, 0), 0),
    updated_at = now()
FROM (
  SELECT venda_id, SUM(valor_total) AS total_itens
  FROM public.produtos_vendas
  WHERE venda_id = '6d1c104d-f827-470b-80d2-b9417c5bffef'
  GROUP BY venda_id
) sub
WHERE v.id = sub.venda_id;
