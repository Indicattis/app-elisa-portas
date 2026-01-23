-- Adicionar coluna para justificativa de não faturamento
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS justificativa_nao_faturada TEXT DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.vendas.justificativa_nao_faturada IS 'Motivo pelo qual a venda ainda não foi faturada';