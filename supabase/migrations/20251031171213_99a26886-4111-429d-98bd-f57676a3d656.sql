-- Primeiro, corrigir o tipo_ordem em pedido_linhas baseado na categoria_linha
UPDATE pedido_linhas
SET tipo_ordem = CASE 
  WHEN categoria_linha = 'solda' THEN 'soldagem'
  WHEN categoria_linha = 'perfiladeira' THEN 'perfiladeira'
  WHEN categoria_linha = 'separacao' THEN 'separacao'
  ELSE tipo_ordem
END
WHERE categoria_linha IS NOT NULL;

-- Limpar dados incorretos do pedido de teste
DELETE FROM linhas_ordens WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_soldagem WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_perfiladeira WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';
DELETE FROM ordens_separacao WHERE pedido_id = '8e60b777-a01b-424a-af9f-ff9d789f9b15';

-- Recriar as ordens com os dados corretos
SELECT public.criar_ordens_producao_automaticas('8e60b777-a01b-424a-af9f-ff9d789f9b15');