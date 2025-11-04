-- Corrigir constraint de status da tabela entregas
-- Primeiro, remover a constraint antiga
ALTER TABLE public.entregas DROP CONSTRAINT IF EXISTS entregas_status_check;

-- Adicionar nova constraint com todos os status necessários
ALTER TABLE public.entregas ADD CONSTRAINT entregas_status_check 
CHECK (status IN (
  'pendente',
  'pendente_producao', 
  'em_producao',
  'em_qualidade',
  'aguardando_pintura',
  'pronta_fabrica',
  'em_rota',
  'concluida',
  'finalizada',
  'cancelada'
));

-- Atualizar a função de sincronização de status para usar os status corretos
CREATE OR REPLACE FUNCTION sync_entrega_status_from_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas atualizar se houver uma entrega associada a este pedido
  IF EXISTS (SELECT 1 FROM entregas WHERE pedido_id = NEW.id) THEN
    -- Mapear etapa do pedido para status da entrega
    IF NEW.etapa_atual IN ('aberto', 'em_producao') THEN
      UPDATE entregas SET status = 'em_producao' WHERE pedido_id = NEW.id;
    ELSIF NEW.etapa_atual = 'inspecao_qualidade' THEN
      UPDATE entregas SET status = 'em_qualidade' WHERE pedido_id = NEW.id;
    ELSIF NEW.etapa_atual = 'aguardando_pintura' THEN
      UPDATE entregas SET status = 'aguardando_pintura' WHERE pedido_id = NEW.id;
    ELSIF NEW.etapa_atual = 'aguardando_coleta' THEN
      UPDATE entregas SET status = 'pronta_fabrica' WHERE pedido_id = NEW.id;
    ELSIF NEW.etapa_atual = 'finalizado' THEN
      UPDATE entregas SET status = 'finalizada' WHERE pedido_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;