-- Adicionar campo atendente_id na tabela orcamentos
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS atendente_id UUID REFERENCES auth.users(id);

-- Criar foreign key constraint para admin_users se necessário
ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_atendente_id_fkey 
FOREIGN KEY (atendente_id) REFERENCES public.admin_users(user_id);