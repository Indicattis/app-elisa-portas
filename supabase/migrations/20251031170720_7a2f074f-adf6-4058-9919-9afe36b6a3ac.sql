-- Limpar dados incorretos do pedido de teste
DELETE FROM linhas_ordens WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_soldagem WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_perfiladeira WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_separacao WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';

-- Recriar as ordens com base nos dados corretos de pedido_linhas
SELECT public.criar_ordens_producao_automaticas('8e60b777-a01b-424a-af9f-ff9d789f9b15');