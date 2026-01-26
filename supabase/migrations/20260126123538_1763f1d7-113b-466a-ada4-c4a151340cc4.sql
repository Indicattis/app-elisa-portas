-- Criar tabela para preços de portas por autorizado
CREATE TABLE public.autorizado_precos_portas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid REFERENCES autorizados(id) ON DELETE CASCADE NOT NULL,
  tamanho text NOT NULL CHECK (tamanho IN ('P', 'G', 'GG')),
  valor numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(autorizado_id, tamanho)
);

-- Habilitar RLS
ALTER TABLE public.autorizado_precos_portas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuarios autenticados podem ver precos"
  ON public.autorizado_precos_portas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir precos"
  ON public.autorizado_precos_portas FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar precos"
  ON public.autorizado_precos_portas FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem deletar precos"
  ON public.autorizado_precos_portas FOR DELETE
  TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_autorizado_precos_portas_updated_at
  BEFORE UPDATE ON public.autorizado_precos_portas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();