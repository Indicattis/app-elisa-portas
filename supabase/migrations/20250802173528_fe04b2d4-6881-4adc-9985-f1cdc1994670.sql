-- Alterar a coluna logo_url para armazenar dados base64 das imagens
ALTER TABLE public.autorizados 
ALTER COLUMN logo_url TYPE text,
ALTER COLUMN logo_url SET DEFAULT NULL;

-- Adicionar comentário para indicar que a coluna armazena base64
COMMENT ON COLUMN public.autorizados.logo_url IS 'Imagem em formato base64';