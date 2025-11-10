-- Remover o trigger ANTIGO com o nome correto
DROP TRIGGER IF EXISTS criar_logistica_ao_avancar_trigger ON pedidos_producao;

-- Remover a função associada ao trigger antigo
DROP FUNCTION IF EXISTS criar_logistica_ao_avancar_producao() CASCADE;

-- Limpar entregas criadas incorretamente (em pedidos que não estão em aguardando_coleta ou finalizado)
DELETE FROM entregas 
WHERE pedido_id IN (
  SELECT id FROM pedidos_producao 
  WHERE etapa_atual IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura')
);

-- Log para confirmar remoção
DO $$
BEGIN
  RAISE LOG '[FIX] Trigger antigo criar_logistica_ao_avancar_trigger removido com sucesso';
  RAISE LOG '[FIX] Entregas prematuras removidas com sucesso';
END $$;