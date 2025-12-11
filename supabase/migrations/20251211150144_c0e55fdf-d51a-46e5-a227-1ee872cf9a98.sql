-- Remover política existente incompleta
DROP POLICY IF EXISTS "Authenticated users can manage estoque" ON estoque;

-- Criar política para INSERT
CREATE POLICY "Authenticated users can insert estoque" 
ON estoque 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar política para UPDATE
CREATE POLICY "Authenticated users can update estoque" 
ON estoque 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar política para DELETE
CREATE POLICY "Authenticated users can delete estoque" 
ON estoque 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);