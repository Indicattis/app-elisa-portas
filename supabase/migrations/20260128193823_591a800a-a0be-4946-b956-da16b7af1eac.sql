-- Corrigir o valor de limite_desconto_presencial de 3 para 5
UPDATE public.configuracoes_vendas 
SET limite_desconto_presencial = 5,
    updated_at = now()
WHERE limite_desconto_presencial = 3;