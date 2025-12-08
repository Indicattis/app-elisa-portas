-- Fase 1: Remover tabelas desnecessárias
DROP TABLE IF EXISTS entregas CASCADE;
DROP TABLE IF EXISTS ordens_instalacao CASCADE;

-- Fase 2: Adaptar tabela instalacoes para ser equivalente a ordens_carregamento

-- Adicionar 'instalacao' ao enum tipo_carregamento
ALTER TYPE tipo_carregamento ADD VALUE IF NOT EXISTS 'instalacao';

-- Adicionar coluna tipo_carregamento se não existir (default 'elisa' por enquanto)
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS tipo_carregamento tipo_carregamento DEFAULT 'elisa';

-- Adicionar data_carregamento como cópia de data_instalacao para compatibilidade futura
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_carregamento date;

-- Adicionar hora_carregamento
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS hora_carregamento time without time zone;

-- Adicionar responsavel_carregamento_id e responsavel_carregamento_nome
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS responsavel_carregamento_id uuid;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS responsavel_carregamento_nome text;

-- Adicionar carregamento_concluido e relacionados
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS carregamento_concluido boolean DEFAULT false;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS carregamento_concluido_em timestamp with time zone;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS carregamento_concluido_por uuid;

-- Adicionar venda_id se não existir (para vincular diretamente à venda)
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS venda_id uuid REFERENCES vendas(id);

-- Sincronizar dados existentes: copiar data_instalacao para data_carregamento
UPDATE instalacoes SET data_carregamento = data_instalacao WHERE data_carregamento IS NULL;

-- Sincronizar hora
UPDATE instalacoes SET hora_carregamento = hora::time WHERE hora_carregamento IS NULL AND hora IS NOT NULL;

-- Sincronizar responsável
UPDATE instalacoes SET 
  responsavel_carregamento_id = responsavel_instalacao_id,
  responsavel_carregamento_nome = responsavel_instalacao_nome
WHERE responsavel_carregamento_id IS NULL AND responsavel_instalacao_id IS NOT NULL;

-- Sincronizar status de conclusão
UPDATE instalacoes SET 
  carregamento_concluido = instalacao_concluida,
  carregamento_concluido_em = instalacao_concluida_em,
  carregamento_concluido_por = instalacao_concluida_por
WHERE carregamento_concluido IS NULL OR carregamento_concluido = false;

-- Sincronizar venda_id a partir do pedido
UPDATE instalacoes i
SET venda_id = pp.venda_id
FROM pedidos_producao pp
WHERE i.pedido_id = pp.id AND i.venda_id IS NULL;