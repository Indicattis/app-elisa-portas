-- Adicionar coluna canal_aquisicao_id na tabela requisicoes_venda
ALTER TABLE public.requisicoes_venda 
ADD COLUMN IF NOT EXISTS canal_aquisicao_id uuid REFERENCES public.canais_aquisicao(id);