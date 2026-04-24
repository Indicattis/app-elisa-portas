INSERT INTO public.produtos_vendas (
  venda_id, tipo_produto, descricao, tamanho, quantidade,
  valor_produto, valor_pintura, valor_instalacao, valor_total,
  desconto_percentual, desconto_valor, tipo_desconto
) VALUES (
  'be506f39-eef4-44cc-8197-40d5b0098bde', 'adicional', 'Meia cana lisa - 0,70mm', '', 106.8,
  11, 0, 0, 1174.80,
  0, 0, 'percentual'
);

UPDATE public.vendas
SET valor_venda = 1974.80
WHERE id = 'be506f39-eef4-44cc-8197-40d5b0098bde';

UPDATE public.contas_receber
SET valor_parcela = ROUND(1974.80 * (2799.91 / 2791.00)::numeric, 2)
WHERE venda_id = 'be506f39-eef4-44cc-8197-40d5b0098bde';