-- Tabela para armazenar observações específicas de cada porta em um pedido
CREATE TABLE IF NOT EXISTS pedido_porta_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_producao(id) ON DELETE CASCADE,
  produto_venda_id UUID NOT NULL REFERENCES produtos_vendas(id) ON DELETE CASCADE,
  
  -- Campos de observação
  responsavel_medidas_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  opcao_tubo TEXT NOT NULL DEFAULT 'sem_tubo',
  interna_externa TEXT NOT NULL DEFAULT 'porta_interna',
  retirada_porta BOOLEAN NOT NULL DEFAULT false,
  posicao_guia TEXT NOT NULL DEFAULT 'guia_dentro_vao',
  opcao_guia TEXT NOT NULL DEFAULT 'guia_aparente',
  opcao_rolo TEXT NOT NULL DEFAULT 'nao_erguer',
  tubo_tiras_frontais TEXT NOT NULL DEFAULT 'sem_tubo_tiras_frontais',
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraint para garantir uma única observação por porta/pedido
  UNIQUE(pedido_id, produto_venda_id)
);

-- Índices
CREATE INDEX idx_pedido_porta_observacoes_pedido ON pedido_porta_observacoes(pedido_id);
CREATE INDEX idx_pedido_porta_observacoes_produto ON pedido_porta_observacoes(produto_venda_id);

-- RLS
ALTER TABLE pedido_porta_observacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage pedido_porta_observacoes"
  ON pedido_porta_observacoes
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comentários
COMMENT ON TABLE pedido_porta_observacoes IS 'Observações e configurações específicas de cada porta em um pedido de produção';
COMMENT ON COLUMN pedido_porta_observacoes.opcao_tubo IS 'sem_tubo | tubo_afastamento';
COMMENT ON COLUMN pedido_porta_observacoes.interna_externa IS 'porta_interna | porta_externa';
COMMENT ON COLUMN pedido_porta_observacoes.posicao_guia IS 'guia_dentro_vao | guia_fora_vao';
COMMENT ON COLUMN pedido_porta_observacoes.opcao_guia IS 'guia_aparente | misto | escondido';
COMMENT ON COLUMN pedido_porta_observacoes.opcao_rolo IS 'nao_erguer | erguer';
COMMENT ON COLUMN pedido_porta_observacoes.tubo_tiras_frontais IS 'com_tubo_tiras_frontais | sem_tubo_tiras_frontais';