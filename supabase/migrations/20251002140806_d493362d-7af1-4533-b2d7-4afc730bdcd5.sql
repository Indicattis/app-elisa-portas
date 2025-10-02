-- Verificar e limpar dados órfãos antes de criar FK
UPDATE public.vendas
SET atendente_id = NULL
WHERE atendente_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = vendas.atendente_id
  );

-- Adicionar foreign key de vendas.atendente_id -> admin_users.id
ALTER TABLE public.vendas
ADD CONSTRAINT vendas_atendente_id_fkey
FOREIGN KEY (atendente_id)
REFERENCES public.admin_users(id)
ON DELETE SET NULL;

-- Criar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_vendas_atendente_id 
ON public.vendas(atendente_id);