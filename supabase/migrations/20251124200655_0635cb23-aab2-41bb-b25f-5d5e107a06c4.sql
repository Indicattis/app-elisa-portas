-- Remover colunas redundantes da tabela instalacoes
-- Essas informações já existem nas tabelas relacionadas (vendas/pedidos_producao)

ALTER TABLE instalacoes 
  DROP COLUMN IF EXISTS produto,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS cidade,
  DROP COLUMN IF EXISTS endereco,
  DROP COLUMN IF EXISTS cep,
  DROP COLUMN IF EXISTS descricao,
  DROP COLUMN IF EXISTS telefone_cliente,
  DROP COLUMN IF EXISTS data_producao,
  DROP COLUMN IF EXISTS justificativa_correcao,
  DROP COLUMN IF EXISTS alterado_para_correcao_em,
  DROP COLUMN IF EXISTS alterado_para_correcao_por;

-- Comentário: Mantemos apenas os campos específicos da instalação:
-- - data_instalacao, hora (data/hora específicas da instalação)
-- - responsavel_instalacao_id, responsavel_instalacao_nome, tipo_instalacao (responsabilidade)
-- - status, instalacao_concluida* (controle da instalação)
-- - latitude, longitude, geocode* (localização específica)
-- - pedido_id, venda_id (relacionamentos)
-- - created_*, updated_* (auditoria)