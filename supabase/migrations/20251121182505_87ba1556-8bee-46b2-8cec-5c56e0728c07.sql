-- Criar bucket para contratos de vendas
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-vendas', 'contratos-vendas', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualizar contratos (público para usuários autenticados)
CREATE POLICY "Usuários autenticados podem visualizar contratos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contratos-vendas');

-- Política para upload de contratos (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload de contratos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contratos-vendas');

-- Política para deletar contratos (apenas quem fez upload)
CREATE POLICY "Usuários podem deletar seus próprios contratos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contratos-vendas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);