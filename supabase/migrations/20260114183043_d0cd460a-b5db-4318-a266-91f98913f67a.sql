-- Excluir pedidos na etapa "aberto"
DELETE FROM pedidos_producao WHERE etapa_atual = 'aberto';