-- Adicionar novos campos para instalações
ALTER TABLE public.instalacoes_cadastradas 
ADD COLUMN IF NOT EXISTS data_producao date,
ADD COLUMN IF NOT EXISTS justificativa_correcao text,
ADD COLUMN IF NOT EXISTS alterado_para_correcao_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS alterado_para_correcao_por uuid REFERENCES public.admin_users(user_id);

-- Remover políticas RLS antigas
DROP POLICY IF EXISTS "Any authenticated user can create instalacoes_cadastradas" ON public.instalacoes_cadastradas;
DROP POLICY IF EXISTS "Authenticated users can delete instalacoes_cadastradas" ON public.instalacoes_cadastradas;
DROP POLICY IF EXISTS "Authenticated users can update instalacoes_cadastradas" ON public.instalacoes_cadastradas;
DROP POLICY IF EXISTS "Authenticated users can view instalacoes_cadastradas" ON public.instalacoes_cadastradas;

-- Política de SELECT: todos usuários autenticados podem visualizar
CREATE POLICY "Authenticated users can view instalacoes"
ON public.instalacoes_cadastradas
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: apenas administradores
CREATE POLICY "Only admins can insert instalacoes"
ON public.instalacoes_cadastradas
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Política de UPDATE: todos autenticados podem atualizar
-- (a validação de campos específicos será feita no client-side)
CREATE POLICY "Authenticated users can update instalacoes"
ON public.instalacoes_cadastradas
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Política de DELETE: apenas administradores
CREATE POLICY "Only admins can delete instalacoes"
ON public.instalacoes_cadastradas
FOR DELETE
TO authenticated
USING (is_admin());