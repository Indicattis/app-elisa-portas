-- ============================================
-- REMOVER SISTEMA ANTIGO DE PERMISSÕES
-- ============================================

-- 1. Primeiro, remover todas as policies que dependem das funções antigas

-- Pedidos producao - remover policies antigas
DROP POLICY IF EXISTS "Users with read permission can view pedidos_producao" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Users with create permission can insert pedidos_producao" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Users with update permission can update pedidos_producao" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Users with delete permission can delete pedidos_producao" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver pedidos" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pedidos" ON public.pedidos_producao;
DROP POLICY IF EXISTS "Usuários autenticados podem criar pedidos" ON public.pedidos_producao;

-- Vendas - remover policies antigas
DROP POLICY IF EXISTS "Users with read permission can view vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users with create permission can insert vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users with update permission can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Users with delete permission can delete vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários com permissão podem ver vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários com permissão podem atualizar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários com permissão podem criar vendas" ON public.vendas;

-- Orcamentos - remover policies antigas
DROP POLICY IF EXISTS "Users with read permission can view orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users with create permission can insert orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users with update permission can update orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users with delete permission can delete orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários com permissão podem ver orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários com permissão podem atualizar orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Usuários com permissão podem criar orcamentos" ON public.orcamentos;

-- 2. Agora podemos remover as funções RLS antigas
DROP FUNCTION IF EXISTS public.has_permission(uuid, app_permission);
DROP FUNCTION IF EXISTS public.has_crud_permission(uuid, crud_resource, crud_action);
DROP FUNCTION IF EXISTS public.has_interface_access(uuid, interface_type);

-- 3. Remover tabelas do sistema antigo (em ordem de dependências)
DROP TABLE IF EXISTS public.user_crud_permissions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.role_interface_access CASCADE;
DROP TABLE IF EXISTS public.setor_interfaces CASCADE;
DROP TABLE IF EXISTS public.app_tabs CASCADE;

-- 4. Remover views antigas
DROP VIEW IF EXISTS public.user_permissions CASCADE;
DROP VIEW IF EXISTS public.user_tab_access CASCADE;

-- 5. Remover types/enums que não são mais necessários
-- Mantemos user_role pois ainda é usado em admin_users
DROP TYPE IF EXISTS app_permission CASCADE;
DROP TYPE IF EXISTS interface_type CASCADE;
DROP TYPE IF EXISTS crud_resource CASCADE;
DROP TYPE IF EXISTS crud_action CASCADE;

-- 6. Criar policies simplificadas para as tabelas

-- Pedidos producao - policies simplificadas
CREATE POLICY "Authenticated users can view pedidos_producao"
  ON public.pedidos_producao FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pedidos_producao"
  ON public.pedidos_producao FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pedidos_producao"
  ON public.pedidos_producao FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete pedidos_producao"
  ON public.pedidos_producao FOR DELETE
  USING (is_admin());

-- Vendas - policies simplificadas
CREATE POLICY "Authenticated users can view vendas"
  ON public.vendas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vendas"
  ON public.vendas FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert vendas"
  ON public.vendas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete vendas"
  ON public.vendas FOR DELETE
  USING (is_admin());

-- Orcamentos - policies simplificadas
CREATE POLICY "Authenticated users can view orcamentos"
  ON public.orcamentos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update orcamentos"
  ON public.orcamentos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert orcamentos"
  ON public.orcamentos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete orcamentos"
  ON public.orcamentos FOR DELETE
  USING (is_admin());

-- 7. Comentários do sistema final simplificado
COMMENT ON TABLE public.app_routes IS 'Definição de todas as rotas do sistema';
COMMENT ON TABLE public.user_route_access IS 'Controle de acesso simplificado: usuário -> rota';
COMMENT ON FUNCTION public.has_route_access(uuid, text) IS 'Única função de verificação de permissões (admin sempre tem acesso)';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se usuário é administrador (acesso total)';