-- Criar bucket público para imagens do catálogo de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalogo-produtos', 'catalogo-produtos', true);

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de imagens do catálogo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'catalogo-produtos');

-- Política para permitir leitura pública das imagens
CREATE POLICY "Imagens do catálogo são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'catalogo-produtos');

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar imagens do catálogo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'catalogo-produtos');

-- Política para permitir deleção por usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar imagens do catálogo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'catalogo-produtos');