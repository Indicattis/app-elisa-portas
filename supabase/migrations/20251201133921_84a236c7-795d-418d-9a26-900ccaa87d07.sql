-- Criar tabela de naturezas de operação para notas fiscais
CREATE TABLE IF NOT EXISTS public.naturezas_operacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice no campo nome para busca rápida
CREATE INDEX idx_naturezas_operacao_nome ON public.naturezas_operacao(nome);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_naturezas_operacao_updated_at
  BEFORE UPDATE ON public.naturezas_operacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.naturezas_operacao ENABLE ROW LEVEL SECURITY;

-- Política de leitura: todos usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler naturezas de operação"
  ON public.naturezas_operacao
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção: apenas usuários autenticados podem inserir
CREATE POLICY "Usuários autenticados podem criar naturezas de operação"
  ON public.naturezas_operacao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de atualização: apenas usuários autenticados podem atualizar
CREATE POLICY "Usuários autenticados podem atualizar naturezas de operação"
  ON public.naturezas_operacao
  FOR UPDATE
  TO authenticated
  USING (true);

-- Inserir naturezas de operação comuns
INSERT INTO public.naturezas_operacao (nome, descricao) VALUES
  ('Venda de mercadoria', 'Venda de mercadoria adquirida ou recebida de terceiros'),
  ('Venda de produção do estabelecimento', 'Venda de mercadoria produzida no estabelecimento'),
  ('Prestação de serviços', 'Prestação de serviços sujeitos ao ISSQN'),
  ('Remessa para demonstração', 'Remessa de mercadoria para demonstração'),
  ('Devolução de venda de mercadoria', 'Devolução de venda de mercadoria'),
  ('Simples remessa', 'Simples remessa de mercadoria');