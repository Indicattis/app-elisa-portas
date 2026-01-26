-- Tabela de acordos de instalação
CREATE TABLE public.acordos_instalacao_autorizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid REFERENCES public.autorizados(id) ON DELETE CASCADE NOT NULL,
  cliente_nome text NOT NULL,
  cliente_cidade text NOT NULL,
  cliente_estado text NOT NULL,
  quantidade_portas integer NOT NULL DEFAULT 1,
  valor_acordado numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  data_acordo date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Tabela de portas do acordo
CREATE TABLE public.acordo_portas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id uuid REFERENCES public.acordos_instalacao_autorizados(id) ON DELETE CASCADE NOT NULL,
  tamanho text NOT NULL CHECK (tamanho IN ('P', 'G', 'GG')),
  valor_unitario numeric(10,2) NOT NULL DEFAULT 0
);

-- RLS para acordos
ALTER TABLE public.acordos_instalacao_autorizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver acordos"
  ON public.acordos_instalacao_autorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir acordos"
  ON public.acordos_instalacao_autorizados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar acordos"
  ON public.acordos_instalacao_autorizados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar acordos"
  ON public.acordos_instalacao_autorizados FOR DELETE TO authenticated USING (true);

-- RLS para portas
ALTER TABLE public.acordo_portas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver portas"
  ON public.acordo_portas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir portas"
  ON public.acordo_portas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar portas"
  ON public.acordo_portas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar portas"
  ON public.acordo_portas FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at em acordos
CREATE TRIGGER update_acordos_instalacao_autorizados_updated_at
  BEFORE UPDATE ON public.acordos_instalacao_autorizados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();