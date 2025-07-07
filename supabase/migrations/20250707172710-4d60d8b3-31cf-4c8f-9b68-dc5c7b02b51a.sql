-- Adicionar coluna canal de aquisição na tabela de leads
ALTER TABLE public.elisaportas_leads 
ADD COLUMN canal_aquisicao TEXT NOT NULL DEFAULT 'Google';

-- Adicionar coluna canal de aquisição na tabela de vendas
ALTER TABLE public.vendas 
ADD COLUMN canal_aquisicao TEXT NOT NULL DEFAULT 'Google';