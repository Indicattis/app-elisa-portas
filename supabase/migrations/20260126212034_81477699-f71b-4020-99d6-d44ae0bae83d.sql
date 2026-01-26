-- =====================================================
-- MIGRAÇÃO: Corrigir dados da etapa aguardando_instalacao
-- Ordem correta: DROP constraint → UPDATE dados → ADD constraint
-- =====================================================

-- Passo 1: PRIMEIRO remover as constraints antigas
ALTER TABLE pedidos_producao 
DROP CONSTRAINT IF EXISTS pedidos_producao_etapa_atual_check;

ALTER TABLE pedidos_etapas 
DROP CONSTRAINT IF EXISTS pedidos_etapas_etapa_check;

-- Passo 2: Agora migrar os dados (sem constraint bloqueando)
UPDATE pedidos_producao 
SET etapa_atual = 'instalacoes',
    updated_at = now()
WHERE etapa_atual = 'aguardando_instalacao';

UPDATE pedidos_etapas
SET etapa = 'instalacoes',
    updated_at = now()
WHERE etapa = 'aguardando_instalacao';

-- Passo 3: Adicionar novas constraints (sem aguardando_instalacao)
ALTER TABLE pedidos_producao 
ADD CONSTRAINT pedidos_producao_etapa_atual_check 
CHECK (etapa_atual IN (
  'aberto',
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'instalacoes',
  'correcoes',
  'finalizado'
));

ALTER TABLE pedidos_etapas 
ADD CONSTRAINT pedidos_etapas_etapa_check 
CHECK (etapa IN (
  'aberto',
  'em_producao', 
  'inspecao_qualidade',
  'aguardando_pintura',
  'aguardando_coleta',
  'instalacoes',
  'correcoes',
  'finalizado'
));

-- Passo 4: Atualizar status das ordens de carregamento para instalações
UPDATE ordens_carregamento oc
SET status = CASE 
  WHEN oc.data_carregamento IS NOT NULL THEN 'agendada'
  ELSE 'pronta_fabrica'
END,
updated_at = now()
FROM vendas v
WHERE oc.venda_id = v.id 
AND v.tipo_entrega = 'instalacao'
AND oc.carregamento_concluido = false;