-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can delete ordens_soldagem" ON ordens_soldagem;
DROP POLICY IF EXISTS "Admins can delete ordens_perfiladeira" ON ordens_perfiladeira;
DROP POLICY IF EXISTS "Admins can delete ordens_separacao" ON ordens_separacao;
DROP POLICY IF EXISTS "Admins can delete ordens_pintura" ON ordens_pintura;
DROP POLICY IF EXISTS "Admins can delete ordens_qualidade" ON ordens_qualidade;
DROP POLICY IF EXISTS "Admins can delete ordens_carregamento" ON ordens_carregamento;

-- Criar políticas corrigidas (verificando 'admin' OU 'administrador')
CREATE POLICY "Admins can delete ordens_soldagem" 
ON ordens_soldagem FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);

CREATE POLICY "Admins can delete ordens_perfiladeira" 
ON ordens_perfiladeira FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);

CREATE POLICY "Admins can delete ordens_separacao" 
ON ordens_separacao FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);

CREATE POLICY "Admins can delete ordens_pintura" 
ON ordens_pintura FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);

CREATE POLICY "Admins can delete ordens_qualidade" 
ON ordens_qualidade FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);

CREATE POLICY "Admins can delete ordens_carregamento" 
ON ordens_carregamento FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'administrador')
    AND ativo = true
  )
);