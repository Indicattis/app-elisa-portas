-- Remover constraints antigas
ALTER TABLE pedidos_producao DROP CONSTRAINT IF EXISTS pedidos_producao_etapa_atual_check;
ALTER TABLE pedidos_etapas DROP CONSTRAINT IF EXISTS pedidos_etapas_etapa_check;

-- Adicionar novas constraints com aprovacao_ceo
ALTER TABLE pedidos_producao 
ADD CONSTRAINT pedidos_producao_etapa_atual_check 
CHECK (etapa_atual IN (
  'aberto',
  'aprovacao_ceo',
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'aguardando_instalacao',
  'instalacoes',
  'correcoes',
  'finalizado'
));

ALTER TABLE pedidos_etapas 
ADD CONSTRAINT pedidos_etapas_etapa_check 
CHECK (etapa IN (
  'aberto',
  'aprovacao_ceo',
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'aguardando_instalacao',
  'instalacoes',
  'correcoes',
  'finalizado'
));