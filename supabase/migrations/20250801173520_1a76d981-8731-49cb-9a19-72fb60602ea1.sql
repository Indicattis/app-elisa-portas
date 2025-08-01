-- Remover todas as políticas existentes do bucket user-avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects; 
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Garantir que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política simples para visualização pública
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-avatars');

-- Política simples para upload - qualquer usuário autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política simples para atualização - qualquer usuário autenticado pode atualizar
CREATE POLICY "Authenticated users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política simples para exclusão - qualquer usuário autenticado pode deletar
CREATE POLICY "Authenticated users can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid() IS NOT NULL
);