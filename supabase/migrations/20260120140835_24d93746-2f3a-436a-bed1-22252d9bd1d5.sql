-- Adicionar colunas para ficha de visita técnica na tabela pedidos_producao
ALTER TABLE pedidos_producao
ADD COLUMN ficha_visita_url TEXT,
ADD COLUMN ficha_visita_nome TEXT;

-- Criar bucket para armazenar fichas de visita técnica
INSERT INTO storage.buckets (id, name, public)
VALUES ('fichas-visita-tecnica', 'fichas-visita-tecnica', true);

-- Policy para permitir uploads por usuários autenticados
CREATE POLICY "Allow authenticated uploads for fichas visita"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fichas-visita-tecnica');

-- Policy para permitir leitura pública das fichas
CREATE POLICY "Allow public read access for fichas visita"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fichas-visita-tecnica');

-- Policy para permitir deletes por usuários autenticados
CREATE POLICY "Allow authenticated deletes for fichas visita"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fichas-visita-tecnica');

-- Policy para permitir updates por usuários autenticados
CREATE POLICY "Allow authenticated updates for fichas visita"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fichas-visita-tecnica');