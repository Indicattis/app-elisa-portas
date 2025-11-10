-- Adicionar política para operadores de fábrica visualizarem pedidos
CREATE POLICY "Operadores de fábrica podem visualizar pedidos"
ON pedidos_producao
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));