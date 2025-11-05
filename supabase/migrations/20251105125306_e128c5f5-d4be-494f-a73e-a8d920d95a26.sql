-- Renomear coluna nota_fiscal para venda_presencial na tabela vendas
ALTER TABLE public.vendas 
RENAME COLUMN nota_fiscal TO venda_presencial;

-- Comentário explicativo
COMMENT ON COLUMN public.vendas.venda_presencial IS 'Indica se a venda foi realizada presencialmente';