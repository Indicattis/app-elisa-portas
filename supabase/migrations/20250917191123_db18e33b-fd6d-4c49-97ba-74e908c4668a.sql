-- Create enum for document categories
CREATE TYPE public.documento_categoria AS ENUM (
  'manual',
  'procedimento',
  'formulario',
  'contrato',
  'politica',
  'outros'
);

-- Create documentos table
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo INTEGER NOT NULL,
  categoria documento_categoria NOT NULL DEFAULT 'outros',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Create policies for documentos
CREATE POLICY "Everyone can view active documents" 
ON public.documentos 
FOR SELECT 
USING (ativo = true);

CREATE POLICY "Authenticated users can create documents" 
ON public.documentos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update documents" 
ON public.documentos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create storage bucket for public documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-publicos', 'documentos-publicos', true);

-- Create storage policies
CREATE POLICY "Public can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos-publicos');

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos-publicos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documentos-publicos' AND auth.uid() IS NOT NULL);

-- Add documentos tab
INSERT INTO public.app_tabs (
  key,
  label,
  href,
  permission,
  tab_group,
  sort_order,
  active,
  icon
) VALUES (
  'documentos',
  'Documentos',
  '/dashboard/documentos',
  'documentos',
  'sidebar',
  8,
  true,
  'FileText'
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();