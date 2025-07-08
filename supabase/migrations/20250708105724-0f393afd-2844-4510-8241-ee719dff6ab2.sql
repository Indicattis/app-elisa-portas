-- Criar tabela para comentários dos leads
CREATE TABLE public.lead_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.elisaportas_leads(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_comentarios ENABLE ROW LEVEL SECURITY;

-- Política para visualização - admins e atendentes podem ver comentários dos leads que têm acesso
CREATE POLICY "Usuários podem ver comentários dos leads que têm acesso"
ON public.lead_comentarios
FOR SELECT
USING (
  -- Admin pode ver todos
  is_admin() OR 
  -- Atendentes podem ver comentários de leads que eles atendem ou leads sem atendente
  (EXISTS (
    SELECT 1 FROM public.elisaportas_leads 
    WHERE id = lead_comentarios.lead_id 
    AND (atendente_id = auth.uid() OR atendente_id IS NULL)
  ))
);

-- Política para inserção - usuários autenticados podem inserir comentários
CREATE POLICY "Usuários autenticados podem inserir comentários"
ON public.lead_comentarios
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- Política para atualização - usuários podem editar apenas seus próprios comentários
CREATE POLICY "Usuários podem editar próprios comentários"
ON public.lead_comentarios
FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Política para deleção - apenas admins e autores dos comentários podem deletar
CREATE POLICY "Admins e autores podem deletar comentários"
ON public.lead_comentarios
FOR DELETE
USING (is_admin() OR usuario_id = auth.uid());