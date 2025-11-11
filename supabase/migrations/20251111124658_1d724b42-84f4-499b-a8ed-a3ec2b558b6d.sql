-- Criar políticas RLS para tabela pedidos_producao usando permissões CRUD
-- Política de SELECT (Read)
CREATE POLICY "Users with read permission can view pedidos_producao"
ON public.pedidos_producao
FOR SELECT
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'pedidos'::crud_resource, 'read'::crud_action)
);

-- Política de INSERT (Create)
CREATE POLICY "Users with create permission can insert pedidos_producao"
ON public.pedidos_producao
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'pedidos'::crud_resource, 'create'::crud_action)
);

-- Política de UPDATE (Update)
CREATE POLICY "Users with update permission can update pedidos_producao"
ON public.pedidos_producao
FOR UPDATE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'pedidos'::crud_resource, 'update'::crud_action)
)
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'pedidos'::crud_resource, 'update'::crud_action)
);

-- Política de DELETE (Delete)
CREATE POLICY "Users with delete permission can delete pedidos_producao"
ON public.pedidos_producao
FOR DELETE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'pedidos'::crud_resource, 'delete'::crud_action)
);

-- Aplicar também para vendas
DROP POLICY IF EXISTS "Users with read permission can view vendas" ON public.vendas;
CREATE POLICY "Users with read permission can view vendas"
ON public.vendas
FOR SELECT
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'vendas'::crud_resource, 'read'::crud_action)
);

DROP POLICY IF EXISTS "Users with create permission can insert vendas" ON public.vendas;
CREATE POLICY "Users with create permission can insert vendas"
ON public.vendas
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'vendas'::crud_resource, 'create'::crud_action)
);

DROP POLICY IF EXISTS "Users with update permission can update vendas" ON public.vendas;
CREATE POLICY "Users with update permission can update vendas"
ON public.vendas
FOR UPDATE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'vendas'::crud_resource, 'update'::crud_action)
)
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'vendas'::crud_resource, 'update'::crud_action)
);

DROP POLICY IF EXISTS "Users with delete permission can delete vendas" ON public.vendas;
CREATE POLICY "Users with delete permission can delete vendas"
ON public.vendas
FOR DELETE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'vendas'::crud_resource, 'delete'::crud_action)
);

-- Aplicar para orcamentos
DROP POLICY IF EXISTS "Users with read permission can view orcamentos" ON public.orcamentos;
CREATE POLICY "Users with read permission can view orcamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'orcamentos'::crud_resource, 'read'::crud_action)
);

DROP POLICY IF EXISTS "Users with create permission can insert orcamentos" ON public.orcamentos;
CREATE POLICY "Users with create permission can insert orcamentos"
ON public.orcamentos
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'orcamentos'::crud_resource, 'create'::crud_action)
);

DROP POLICY IF EXISTS "Users with update permission can update orcamentos" ON public.orcamentos;
CREATE POLICY "Users with update permission can update orcamentos"
ON public.orcamentos
FOR UPDATE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'orcamentos'::crud_resource, 'update'::crud_action)
)
WITH CHECK (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'orcamentos'::crud_resource, 'update'::crud_action)
);

DROP POLICY IF EXISTS "Users with delete permission can delete orcamentos" ON public.orcamentos;
CREATE POLICY "Users with delete permission can delete orcamentos"
ON public.orcamentos
FOR DELETE
TO authenticated
USING (
  is_admin() OR 
  public.has_crud_permission(auth.uid(), 'orcamentos'::crud_resource, 'delete'::crud_action)
);