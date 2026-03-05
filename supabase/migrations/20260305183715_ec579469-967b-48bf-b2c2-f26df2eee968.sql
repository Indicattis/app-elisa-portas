UPDATE public.vendas v
SET 
  cliente_nome = c.nome,
  cliente_telefone = c.telefone
FROM public.clientes c
WHERE v.cliente_id = c.id
AND (v.cliente_nome IS DISTINCT FROM c.nome OR v.cliente_telefone IS DISTINCT FROM c.telefone)