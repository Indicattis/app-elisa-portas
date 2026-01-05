-- Adicionar coluna tipo_fabricacao na tabela vendas_catalogo
ALTER TABLE vendas_catalogo 
ADD COLUMN IF NOT EXISTS tipo_fabricacao TEXT DEFAULT 'interno' CHECK (tipo_fabricacao IN ('interno', 'terceirizado'));

-- Adicionar coluna tipo_fabricacao na tabela produtos_vendas
ALTER TABLE produtos_vendas 
ADD COLUMN IF NOT EXISTS tipo_fabricacao TEXT DEFAULT 'interno' CHECK (tipo_fabricacao IN ('interno', 'terceirizado'));

-- Criar tabela ordens_terceirizacao
CREATE TABLE IF NOT EXISTS ordens_terceirizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos_producao(id) ON DELETE CASCADE,
  produto_venda_id UUID REFERENCES produtos_vendas(id) ON DELETE SET NULL,
  numero_ordem TEXT NOT NULL,
  descricao_produto TEXT,
  quantidade INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  responsavel_id UUID,
  em_backlog BOOLEAN DEFAULT false,
  prioridade INTEGER DEFAULT 0,
  historico BOOLEAN DEFAULT false,
  observacoes TEXT,
  capturada_em TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  tempo_conclusao_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Habilitar RLS
ALTER TABLE ordens_terceirizacao ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Permitir leitura para usuários autenticados" 
ON ordens_terceirizacao 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" 
ON ordens_terceirizacao 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" 
ON ordens_terceirizacao 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" 
ON ordens_terceirizacao 
FOR DELETE 
TO authenticated 
USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_ordens_terceirizacao_pedido_id ON ordens_terceirizacao(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ordens_terceirizacao_status ON ordens_terceirizacao(status);
CREATE INDEX IF NOT EXISTS idx_ordens_terceirizacao_historico ON ordens_terceirizacao(historico);