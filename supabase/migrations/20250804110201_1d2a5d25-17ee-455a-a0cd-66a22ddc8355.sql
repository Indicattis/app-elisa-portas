-- Adicionar campo região na tabela marketing_investimentos
ALTER TABLE public.marketing_investimentos 
ADD COLUMN regiao text;

-- Criar índice para melhor performance nas consultas por região
CREATE INDEX idx_marketing_investimentos_regiao ON public.marketing_investimentos(regiao);