UPDATE produtos_vendas pv
SET vendas_catalogo_id = vc.id
FROM vendas v, vendas_catalogo vc
WHERE pv.venda_id = v.id
  AND pv.tipo_produto IN ('adicional','acessorio','manutencao')
  AND pv.vendas_catalogo_id IS NULL
  AND v.created_at >= date_trunc('month', now())
  AND v.created_at < date_trunc('month', now()) + interval '1 month'
  AND vc.ativo = true
  AND LOWER(TRIM(vc.nome_produto)) = LOWER(TRIM(pv.descricao))
  AND (
    SELECT COUNT(*) FROM vendas_catalogo vc2
    WHERE vc2.ativo = true AND LOWER(TRIM(vc2.nome_produto)) = LOWER(TRIM(pv.descricao))
  ) = 1;