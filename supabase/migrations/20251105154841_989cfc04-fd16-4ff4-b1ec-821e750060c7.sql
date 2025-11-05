-- Criar tabela para controle de início de pintura
CREATE TABLE public.pintura_inicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iniciado_por UUID NOT NULL,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pintura_inicios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view pintura_inicios" 
ON public.pintura_inicios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create pintura_inicios" 
ON public.pintura_inicios 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND iniciado_por = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pintura_inicios_updated_at
BEFORE UPDATE ON public.pintura_inicios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();