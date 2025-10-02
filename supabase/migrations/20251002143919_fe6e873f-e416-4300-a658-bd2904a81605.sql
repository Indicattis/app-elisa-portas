-- 2. Atualizar registros existentes convertendo user_id para admin_users.id
UPDATE public.instalacoes_cadastradas ic
SET created_by = au.id
FROM public.admin_users au
WHERE ic.created_by = au.user_id;

-- 3. Adicionar foreign key correta
ALTER TABLE public.instalacoes_cadastradas
ADD CONSTRAINT instalacoes_cadastradas_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.admin_users(id) 
ON DELETE SET NULL;