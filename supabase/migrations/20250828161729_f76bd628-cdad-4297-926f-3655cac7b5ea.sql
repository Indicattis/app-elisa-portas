-- Add atendente_id column to contador_vendas_dias table
ALTER TABLE public.contador_vendas_dias 
ADD COLUMN atendente_id uuid REFERENCES public.admin_users(user_id);

-- Backfill existing records with the created_by user
UPDATE public.contador_vendas_dias 
SET atendente_id = created_by 
WHERE atendente_id IS NULL;

-- Make atendente_id required for new records
ALTER TABLE public.contador_vendas_dias 
ALTER COLUMN atendente_id SET NOT NULL;

-- Add unique constraint to prevent duplicate entries per day per attendant
ALTER TABLE public.contador_vendas_dias 
ADD CONSTRAINT unique_dia_atendente UNIQUE (data, atendente_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Criadores ou admins podem atualizar contador de vendas" ON public.contador_vendas_dias;
DROP POLICY IF EXISTS "Usuários autenticados podem criar contador de vendas" ON public.contador_vendas_dias;
DROP POLICY IF EXISTS "Usuários autenticados podem ver contador de vendas" ON public.contador_vendas_dias;

-- Create new RLS policies for individual attendant sales
CREATE POLICY "Atendentes podem ver todas as vendas" 
ON public.contador_vendas_dias 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users au 
  WHERE au.user_id = auth.uid() AND au.ativo = true
));

CREATE POLICY "Atendentes podem criar suas próprias vendas" 
ON public.contador_vendas_dias 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  atendente_id = auth.uid() AND 
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() AND au.ativo = true
  )
);

CREATE POLICY "Atendentes podem atualizar suas próprias vendas" 
ON public.contador_vendas_dias 
FOR UPDATE 
USING (atendente_id = auth.uid() OR is_admin())
WITH CHECK (atendente_id = auth.uid() OR is_admin());

CREATE POLICY "Admins podem deletar vendas" 
ON public.contador_vendas_dias 
FOR DELETE 
USING (is_admin());