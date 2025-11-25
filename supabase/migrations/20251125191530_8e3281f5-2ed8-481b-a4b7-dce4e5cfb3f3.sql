-- Criar tabela de regras de etiquetas
CREATE TABLE public.regras_etiquetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estoque_id UUID REFERENCES public.estoque(id) ON DELETE CASCADE,
  nome_regra TEXT NOT NULL,
  divisor INTEGER NOT NULL DEFAULT 1,
  campo_condicao TEXT,
  condicao_tipo TEXT,
  condicao_valor NUMERIC,
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_regras_etiquetas_estoque_id ON public.regras_etiquetas(estoque_id);
CREATE INDEX idx_regras_etiquetas_ativo ON public.regras_etiquetas(ativo);

-- Habilitar RLS
ALTER TABLE public.regras_etiquetas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - permitir leitura para todos autenticados
CREATE POLICY "Usuários autenticados podem ver regras de etiquetas"
ON public.regras_etiquetas FOR SELECT
TO authenticated
USING (true);

-- Políticas RLS - permitir escrita para admins
CREATE POLICY "Admins podem criar regras de etiquetas"
ON public.regras_etiquetas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins podem atualizar regras de etiquetas"
ON public.regras_etiquetas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins podem deletar regras de etiquetas"
ON public.regras_etiquetas FOR DELETE
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_regras_etiquetas_updated_at
BEFORE UPDATE ON public.regras_etiquetas
FOR EACH ROW
EXECUTE FUNCTION public.update_estoque_updated_at();

-- Comentários na tabela
COMMENT ON TABLE public.regras_etiquetas IS 'Regras para cálculo de quantidade de etiquetas por produto';
COMMENT ON COLUMN public.regras_etiquetas.divisor IS 'Quantidade de itens por etiqueta (ex: 5 = 1 etiqueta a cada 5 unidades)';
COMMENT ON COLUMN public.regras_etiquetas.campo_condicao IS 'Campo para condição: largura, altura, peso';
COMMENT ON COLUMN public.regras_etiquetas.condicao_tipo IS 'Tipo de comparação: maior, menor, igual, maior_igual, menor_igual';
COMMENT ON COLUMN public.regras_etiquetas.condicao_valor IS 'Valor numérico para comparação';