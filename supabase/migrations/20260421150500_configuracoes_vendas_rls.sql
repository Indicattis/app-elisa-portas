-- Corrigir RLS de configuracoes_vendas: usar has_role(user_id, 'administrador') em vez de
-- comparar admin_users.role diretamente. A fonte canônica de roles é a tabela user_roles.

DROP POLICY IF EXISTS "Administradores podem atualizar configurações" ON public.configuracoes_vendas;
DROP POLICY IF EXISTS "Administradores podem inserir configurações" ON public.configuracoes_vendas;

CREATE POLICY "Administradores podem atualizar configurações"
ON public.configuracoes_vendas
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'::text))
WITH CHECK (public.has_role(auth.uid(), 'administrador'::text));

CREATE POLICY "Administradores podem inserir configurações"
ON public.configuracoes_vendas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'administrador'::text));
