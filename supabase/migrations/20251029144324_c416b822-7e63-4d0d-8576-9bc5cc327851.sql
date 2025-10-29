-- Adicionar coluna de prioridade na tabela pedidos_producao
ALTER TABLE pedidos_producao 
ADD COLUMN IF NOT EXISTS prioridade_etapa INTEGER DEFAULT 0;

-- Criar índice para melhor performance nas queries de ordenação
CREATE INDEX IF NOT EXISTS idx_pedidos_producao_prioridade 
ON pedidos_producao(etapa_atual, prioridade_etapa DESC, created_at DESC);

-- Adicionar comentário para documentação
COMMENT ON COLUMN pedidos_producao.prioridade_etapa IS 
'Prioridade do pedido dentro da etapa atual. Valores maiores = maior prioridade. Resetado ao mudar de etapa.';