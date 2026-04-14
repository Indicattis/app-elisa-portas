-- Atualizar porta 9.60x6.60 para quantidade 2
UPDATE public.produtos_vendas SET quantidade = 2 WHERE id = '01bf7338-c52e-45a7-bec7-9180a8800395';

-- Atualizar porta 4.24x3.90 para quantidade 2
UPDATE public.produtos_vendas SET quantidade = 2 WHERE id = '94973500-063a-4949-bf5b-6bf8b8ae53fd';

-- Deletar registro duplicado da porta 4.24x3.90
DELETE FROM public.produtos_vendas WHERE id = '663a1699-a15f-4d4a-93f3-67e81f8cc460';