-- Alterar coluna lead_id para permitir valores nulos (vendas avulsas)
ALTER TABLE public.vendas ALTER COLUMN lead_id DROP NOT NULL;