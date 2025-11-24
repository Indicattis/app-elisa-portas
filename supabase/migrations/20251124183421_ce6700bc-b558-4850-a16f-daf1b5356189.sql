-- Remover trigger que cria instalações automaticamente ao avançar etapa do pedido
DROP TRIGGER IF EXISTS trigger_criar_instalacao_ao_aguardar_instalacao ON pedidos_producao;

-- Remover a função (mantida por histórico mas não será mais usada)
DROP FUNCTION IF EXISTS criar_instalacao_ao_aguardar_instalacao();

COMMENT ON TABLE instalacoes_cadastradas IS 'Instalações agora são criadas apenas manualmente via interface /instalacoes';