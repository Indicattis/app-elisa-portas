-- Criar tabela almoxarifado para gerenciar insumos
CREATE TABLE public.almoxarifado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  quantidade_minima NUMERIC NOT NULL DEFAULT 0,
  quantidade_maxima NUMERIC NOT NULL DEFAULT 0,
  quantidade_estoque NUMERIC NOT NULL DEFAULT 0,
  data_ultima_conferencia DATE,
  custo NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'Un.',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.almoxarifado ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ler almoxarifado"
ON public.almoxarifado
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir almoxarifado"
ON public.almoxarifado
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar almoxarifado"
ON public.almoxarifado
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar almoxarifado"
ON public.almoxarifado
FOR DELETE
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_almoxarifado_updated_at
BEFORE UPDATE ON public.almoxarifado
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir rotas de permissões
INSERT INTO public.app_routes (key, label, path, parent_key, active, sort_order)
VALUES 
  ('estoque_hub', 'Estoque', '/estoque', NULL, true, 70),
  ('estoque_fabrica', 'Fábrica', '/estoque/fabrica', 'estoque_hub', true, 71),
  ('estoque_almoxarifado', 'Almoxarifado', '/estoque/almoxarifado', 'estoque_hub', true, 72),
  ('estoque_fornecedores', 'Fornecedores', '/estoque/fornecedores', 'estoque_hub', true, 73);