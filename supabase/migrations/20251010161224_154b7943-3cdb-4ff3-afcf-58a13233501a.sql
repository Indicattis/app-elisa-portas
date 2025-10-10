-- Inserir registro de controle de numeração para pedidos de produção se não existir
INSERT INTO numeracao_controle (tipo, proximo_numero)
VALUES ('pedido_producao', 1)
ON CONFLICT (tipo) DO NOTHING;