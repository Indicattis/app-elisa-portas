-- Criar tabela de notas fiscais
CREATE TABLE public.notas_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  numero VARCHAR(50) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  chave_acesso VARCHAR(44),
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  data_emissao DATE NOT NULL,
  data_vencimento DATE,
  cnpj_cpf VARCHAR(20) NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'emitida' CHECK (status IN ('emitida', 'pendente', 'cancelada')),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  xml_url TEXT,
  pdf_url TEXT,
  xml_nome_arquivo VARCHAR(255),
  pdf_nome_arquivo VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(numero, serie, tipo)
);

-- Habilitar RLS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem visualizar notas fiscais"
  ON public.notas_fiscais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir notas fiscais"
  ON public.notas_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar notas fiscais"
  ON public.notas_fiscais FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir notas fiscais"
  ON public.notas_fiscais FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhor performance
CREATE INDEX idx_notas_fiscais_tipo ON public.notas_fiscais(tipo);
CREATE INDEX idx_notas_fiscais_status ON public.notas_fiscais(status);
CREATE INDEX idx_notas_fiscais_data_emissao ON public.notas_fiscais(data_emissao);
CREATE INDEX idx_notas_fiscais_venda_id ON public.notas_fiscais(venda_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_eventos_updated_at_column();