-- Fix installments for sale 84878178-473f-4751-b42c-17c26a490f5f (IVAIR LODI)
-- Paid installment (a_vista R$ 1.440) stays as parcela 1
-- Pending installment (dinheiro) becomes parcela 2 with corrected value R$ 3.560

UPDATE public.contas_receber
SET numero_parcela = 2,
    valor_parcela = 3560.00,
    updated_at = now()
WHERE venda_id = '84878178-473f-4751-b42c-17c26a490f5f'
  AND metodo_pagamento = 'dinheiro'
  AND status = 'pendente';

-- Update sale header to reflect correct entrada and saldo
UPDATE public.vendas
SET valor_entrada = 1440.00,
    valor_a_receber = 3560.00,
    updated_at = now()
WHERE id = '84878178-473f-4751-b42c-17c26a490f5f';