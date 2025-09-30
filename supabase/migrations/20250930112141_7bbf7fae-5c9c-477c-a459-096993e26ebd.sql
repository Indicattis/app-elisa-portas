-- Criar tabela para instalações cadastradas
CREATE TABLE public.instalacoes_cadastradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  estado TEXT NOT NULL,
  cidade TEXT NOT NULL,
  tamanho TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_geocoded_at TIMESTAMP WITH TIME ZONE,
  geocode_precision TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.instalacoes_cadastradas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view instalacoes_cadastradas"
ON public.instalacoes_cadastradas
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create instalacoes_cadastradas"
ON public.instalacoes_cadastradas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update instalacoes_cadastradas"
ON public.instalacoes_cadastradas
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete instalacoes_cadastradas"
ON public.instalacoes_cadastradas
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_instalacoes_cadastradas_updated_at
BEFORE UPDATE ON public.instalacoes_cadastradas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for geocoding queries
CREATE INDEX idx_instalacoes_cadastradas_coordinates ON public.instalacoes_cadastradas(latitude, longitude);
CREATE INDEX idx_instalacoes_cadastradas_location ON public.instalacoes_cadastradas(estado, cidade);