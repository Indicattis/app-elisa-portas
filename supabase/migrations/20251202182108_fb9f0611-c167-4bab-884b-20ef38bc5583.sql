-- Adicionar campos numero_orcamento e observacoes na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS numero_orcamento integer,
ADD COLUMN IF NOT EXISTS observacoes text;

-- Criar índice único para o número do orçamento
CREATE UNIQUE INDEX IF NOT EXISTS idx_orcamentos_numero_orcamento 
ON public.orcamentos(numero_orcamento) 
WHERE numero_orcamento IS NOT NULL;

-- Adicionar comentário nos campos
COMMENT ON COLUMN public.orcamentos.numero_orcamento IS 'Número sequencial do orçamento (0001, 0002, etc.)';
COMMENT ON COLUMN public.orcamentos.observacoes IS 'Observações gerais do orçamento';