
-- Bucket para fotos de carregamento
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-carregamento', 'fotos-carregamento', true);

-- Políticas de acesso
CREATE POLICY "Acesso publico leitura fotos-carregamento" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-carregamento');
CREATE POLICY "Upload autenticado fotos-carregamento" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-carregamento');

-- Colunas para URL da foto
ALTER TABLE public.ordens_carregamento ADD COLUMN IF NOT EXISTS foto_carregamento_url TEXT;
ALTER TABLE public.instalacoes ADD COLUMN IF NOT EXISTS foto_carregamento_url TEXT;
