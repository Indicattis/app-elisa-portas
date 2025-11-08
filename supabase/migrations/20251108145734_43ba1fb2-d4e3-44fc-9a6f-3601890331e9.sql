-- Adicionar coluna codigo_usuario para autenticação simplificada na interface de produção
ALTER TABLE public.admin_users 
ADD COLUMN codigo_usuario TEXT UNIQUE;

-- Criar índice para melhorar performance nas buscas por código
CREATE INDEX idx_admin_users_codigo_usuario ON public.admin_users(codigo_usuario) 
WHERE codigo_usuario IS NOT NULL;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.admin_users.codigo_usuario IS 'Código único usado para autenticação simplificada na interface de produção';