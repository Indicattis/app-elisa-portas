-- Restore the missing 4th porta_enrolar record for venda dedb1934
INSERT INTO public.produtos_vendas (
  venda_id, tipo_produto, descricao, quantidade, largura, altura, tamanho,
  valor_produto, valor_pintura, valor_instalacao, valor_frete,
  valor_total, valor_total_sem_frete,
  tipo_desconto, desconto_percentual, desconto_valor,
  lucro_item, lucro_produto, lucro_pintura,
  custo_producao, percentual_credito, valor_credito,
  tipo_fabricacao, faturamento,
  cor_id, acessorio_id, adicional_id, vendas_catalogo_id
)
SELECT
  venda_id, tipo_produto, descricao, 1, largura, altura, tamanho,
  valor_produto, valor_pintura, valor_instalacao, valor_frete,
  valor_total, valor_total_sem_frete,
  tipo_desconto, desconto_percentual, desconto_valor,
  lucro_item, lucro_produto, lucro_pintura,
  custo_producao, percentual_credito, valor_credito,
  tipo_fabricacao, faturamento,
  cor_id, acessorio_id, adicional_id, vendas_catalogo_id
FROM public.produtos_vendas
WHERE id = '94973500-063a-4949-bf5b-6bf8b8ae53fd';
