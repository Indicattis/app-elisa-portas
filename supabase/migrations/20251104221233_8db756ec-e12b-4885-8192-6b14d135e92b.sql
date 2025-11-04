-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('fisica', 'juridica')),
  nome text NOT NULL,
  responsavel text,
  cnpj text,
  estado text,
  cidade text,
  bairro text,
  cep text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view fornecedores"
ON public.fornecedores
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create fornecedores"
ON public.fornecedores
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fornecedores"
ON public.fornecedores
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fornecedores"
ON public.fornecedores
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX idx_fornecedores_ativo ON public.fornecedores(ativo);
CREATE INDEX idx_fornecedores_tipo ON public.fornecedores(tipo);