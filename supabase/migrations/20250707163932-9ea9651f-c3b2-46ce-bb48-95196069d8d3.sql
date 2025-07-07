
-- Adicionar coluna para foto de perfil na tabela admin_users
ALTER TABLE public.admin_users 
ADD COLUMN foto_perfil_url text;

-- Criar bucket para fotos de perfil se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir upload de fotos de perfil
CREATE POLICY "Usuários podem fazer upload de suas fotos de perfil"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar política para visualizar fotos de perfil
CREATE POLICY "Fotos de perfil são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');

-- Criar política para atualizar fotos de perfil
CREATE POLICY "Usuários podem atualizar suas fotos de perfil"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar política para deletar fotos de perfil
CREATE POLICY "Usuários podem deletar suas fotos de perfil"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
