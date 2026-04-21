-- Corrige inconsistência de parcelas na venda 84878178 (IVAIR LODI):
-- Havia 2 parcelas com numero_parcela=1 e total (R$ 6.500) divergente do
-- valor real da venda (R$ 5.000 = R$ 4.800 produto com desconto + R$ 200 frete).

-- 1) Parcela já paga À Vista — apenas garante numero_parcela = 1
UPDATE public.contas_receber
SET numero_parcela = 1
WHERE id = '883d4006-4d3d-47bc-a41f-ecb2a5c9946f';

-- 2) Parcela pendente "Dinheiro" — passa a ser parcela 2 e valor é ajustado
--    para R$ 3.560 (R$ 5.000 total - R$ 1.440 já pago)
UPDATE public.contas_receber
SET numero_parcela = 2,
    valor_parcela = 3560
WHERE id = '003923d5-3e64-45ff-86f7-30074c311ae1';

-- 3) Atualiza cabeçalho da venda: entrada à vista paga + saldo a receber
UPDATE public.vendas
SET valor_entrada = 1440,
    valor_a_receber = 3560,
    numero_parcelas = 1,
    quantidade_parcelas = 1
WHERE id = '84878178-473f-4751-b42c-17c26a490f5f';
