-- Backfill: separar quantidade x tamanho para itens de catálogo com unidades decimais (Metro/Kg/Litro)
-- Estratégia genérica: mover valor decimal de `quantidade` para `tamanho` e setar `quantidade=1`.
-- Excluímos itens cuja `quantidade` já seja inteira (provavelmente já no novo formato).

UPDATE public.produtos_vendas pv
SET 
  tamanho = trim(both '0' from to_char(pv.quantidade, 'FM999999990.00')),
  quantidade = 1
FROM public.vendas_catalogo vc
WHERE pv.vendas_catalogo_id = vc.id
  AND lower(vc.unidade) IN ('metro', 'kg', 'litro')
  AND pv.quantidade <> floor(pv.quantidade)
  AND (pv.tamanho IS NULL OR pv.tamanho = '');

-- Correção específica para a venda be506f39-eef4-44cc-8197-40d5b0098bde:
-- 20 itens de "Meia cana lisa - 0,70mm" com 5,34m cada (total 106,8m).
UPDATE public.produtos_vendas
SET quantidade = 20, tamanho = '5.34'
WHERE id = 'cb119f1f-2cc5-425c-9aba-a0295fd9daaa';