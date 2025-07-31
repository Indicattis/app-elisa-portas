-- Create a table for calendar events
CREATE TABLE public.eventos_calendario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_evento TEXT NOT NULL,
  horario_evento TIME NOT NULL,
  data_evento DATE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('data_comemorativa', 'reuniao', 'evento', 'campanha')),
  descricao_evento TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for event members (many-to-many relationship)
CREATE TABLE public.eventos_membros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.eventos_calendario(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_membros ENABLE ROW LEVEL SECURITY;

-- Create policies for eventos_calendario
CREATE POLICY "Usuários autenticados podem ver eventos" 
ON public.eventos_calendario 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid() 
  AND admin_users.ativo = true
));

CREATE POLICY "Usuários autenticados podem criar eventos" 
ON public.eventos_calendario 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true
  )
);

CREATE POLICY "Criadores e admins podem atualizar eventos" 
ON public.eventos_calendario 
FOR UPDATE 
USING (
  created_by = auth.uid() 
  OR is_admin()
);

CREATE POLICY "Criadores e admins podem deletar eventos" 
ON public.eventos_calendario 
FOR DELETE 
USING (
  created_by = auth.uid() 
  OR is_admin()
);

-- Create policies for eventos_membros
CREATE POLICY "Usuários autenticados podem ver membros de eventos" 
ON public.eventos_membros 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid() 
  AND admin_users.ativo = true
));

CREATE POLICY "Usuários autenticados podem adicionar membros" 
ON public.eventos_membros 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true
  )
);

CREATE POLICY "Usuários podem remover membros de eventos que criaram" 
ON public.eventos_membros 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM eventos_calendario 
    WHERE eventos_calendario.id = eventos_membros.evento_id 
    AND (eventos_calendario.created_by = auth.uid() OR is_admin())
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_eventos_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_eventos_updated_at
BEFORE UPDATE ON public.eventos_calendario
FOR EACH ROW
EXECUTE FUNCTION public.update_eventos_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_eventos_data_evento ON public.eventos_calendario(data_evento);
CREATE INDEX idx_eventos_categoria ON public.eventos_calendario(categoria);
CREATE INDEX idx_eventos_membros_evento_id ON public.eventos_membros(evento_id);
CREATE INDEX idx_eventos_membros_user_id ON public.eventos_membros(user_id);