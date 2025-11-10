-- Criar políticas RLS para pintura_inicios

-- Permitir que qualquer usuário autenticado insira registros
CREATE POLICY "Permitir inserção de inicios de pintura"
ON pintura_inicios
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que qualquer usuário autenticado visualize registros
CREATE POLICY "Permitir visualização de inicios de pintura"
ON pintura_inicios
FOR SELECT
TO authenticated
USING (true);

-- Permitir que qualquer usuário autenticado atualize registros
CREATE POLICY "Permitir atualização de inicios de pintura"
ON pintura_inicios
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir que qualquer usuário autenticado delete registros (se necessário)
CREATE POLICY "Permitir exclusão de inicios de pintura"
ON pintura_inicios
FOR DELETE
TO authenticated
USING (true);