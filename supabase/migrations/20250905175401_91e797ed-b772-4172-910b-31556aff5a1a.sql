-- Adicionar coluna vendedor_id na tabela autorizados
ALTER TABLE public.autorizados 
ADD COLUMN vendedor_id uuid REFERENCES public.admin_users(id);