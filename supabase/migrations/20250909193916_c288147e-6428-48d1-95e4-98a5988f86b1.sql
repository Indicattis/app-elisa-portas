-- Create enum for rating categories
CREATE TYPE autorizado_rating_categoria AS ENUM ('instalacao', 'suporte', 'atendimento');

-- Create autorizados_ratings table
CREATE TABLE public.autorizados_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id UUID NOT NULL REFERENCES public.autorizados(id) ON DELETE CASCADE,
  atendente_id UUID NOT NULL,
  categoria autorizado_rating_categoria NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 5),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.autorizados_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view ratings" 
ON public.autorizados_ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create ratings" 
ON public.autorizados_ratings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND atendente_id = auth.uid());

CREATE POLICY "Users can update their own ratings" 
ON public.autorizados_ratings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND atendente_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_autorizados_ratings_autorizado_id ON public.autorizados_ratings(autorizado_id);
CREATE INDEX idx_autorizados_ratings_atendente_id ON public.autorizados_ratings(atendente_id);
CREATE INDEX idx_autorizados_ratings_categoria ON public.autorizados_ratings(categoria);

-- Create trigger for updated_at
CREATE TRIGGER update_autorizados_ratings_updated_at
BEFORE UPDATE ON public.autorizados_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();