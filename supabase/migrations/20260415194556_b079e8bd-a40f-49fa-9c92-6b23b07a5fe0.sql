
-- Fix sale 56e4efeb: insert separate installation products and zero out valor_instalacao on doors

-- Insert installation product for door c59cd815
INSERT INTO produtos_vendas (venda_id, tipo_produto, tamanho, valor_produto, valor_pintura, valor_instalacao, valor_frete, tipo_desconto, desconto_percentual, desconto_valor, quantidade, descricao)
VALUES ('56e4efeb-3792-408a-9283-297cb21954ec', 'instalacao', '2.87x3.5', 2300, 0, 0, 0, 'percentual', 0, 0, 1, 'Instalação');

-- Insert installation product for door 65b1db27
INSERT INTO produtos_vendas (venda_id, tipo_produto, tamanho, valor_produto, valor_pintura, valor_instalacao, valor_frete, tipo_desconto, desconto_percentual, desconto_valor, quantidade, descricao)
VALUES ('56e4efeb-3792-408a-9283-297cb21954ec', 'instalacao', '2.87x3.5', 2300, 0, 0, 0, 'percentual', 0, 0, 1, 'Instalação');

-- Zero out valor_instalacao on the two door products (trigger will recalculate valor_total)
UPDATE produtos_vendas SET valor_instalacao = 0 WHERE id IN ('c59cd815-3cac-4566-97a5-5b3920461b79', '65b1db27-be42-48cb-877e-1d4d92ad5b0c');
