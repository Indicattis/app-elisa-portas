-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagamento', 'comprovantes-pagamento', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload autenticado
CREATE POLICY "Usuários autenticados podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprovantes-pagamento');

-- Política para leitura pública
CREATE POLICY "Comprovantes são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comprovantes-pagamento');

-- Política para atualização
CREATE POLICY "Usuários autenticados podem atualizar comprovantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'comprovantes-pagamento');

-- Política para exclusão
CREATE POLICY "Usuários autenticados podem excluir comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprovantes-pagamento');