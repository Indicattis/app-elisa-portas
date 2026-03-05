

# Refaturar lucro das portas de enrolar (Janeiro e Fevereiro 2026)

## O que será feito

Atualizar o `lucro_item` e `custo_producao` de todas as portas de enrolar vendidas em janeiro e fevereiro de 2026, usando os valores de lucro da tabela de preços (`tabela_precos_portas`), e em seguida recalcular o `lucro_total` e `custo_total` de cada venda afetada.

## Lógica de matching

Para cada porta vendida, encontrar a menor entrada na tabela de preços onde:
- `tabela.largura >= porta.largura - 0.15` (tolerância 15cm)
- `tabela.altura >= porta.altura - 0.15` (tolerância 15cm)
- Ordenar por largura e altura crescente (pegar a menor que atende)

Dimensões extraídas de `COALESCE(largura, SPLIT_PART(tamanho, 'x', 1))`.

## Operações (via insert tool — dados, não schema)

### Passo 1: Atualizar produtos_vendas
```sql
UPDATE produtos_vendas pv
SET 
  lucro_item = matched.lucro * pv.quantidade,
  custo_producao = pv.valor_total - (matched.lucro * pv.quantidade)
FROM (
  SELECT DISTINCT ON (pv2.id) pv2.id as produto_id, tp.lucro
  FROM produtos_vendas pv2
  JOIN vendas v ON v.id = pv2.venda_id
  CROSS JOIN LATERAL (
    SELECT tp.lucro
    FROM tabela_precos_portas tp
    WHERE tp.ativo = true
      AND tp.largura >= (COALESCE(pv2.largura, SPLIT_PART(pv2.tamanho,'x',1)::numeric) - 0.15)
      AND tp.altura >= (COALESCE(pv2.altura, SPLIT_PART(pv2.tamanho,'x',2)::numeric) - 0.15)
    ORDER BY tp.largura, tp.altura
    LIMIT 1
  ) tp
  WHERE pv2.tipo_produto = 'porta_enrolar'
    AND v.created_at >= '2026-01-01'
    AND v.created_at < '2026-03-01'
) matched
WHERE pv.id = matched.produto_id;
```

### Passo 2: Recalcular totais de cada venda afetada
```sql
UPDATE vendas v
SET 
  lucro_total = sub.soma_lucro + COALESCE(v.lucro_instalacao, 0),
  custo_total = sub.soma_custo + COALESCE(v.custo_instalacao, 0)
FROM (
  SELECT pv.venda_id, 
    SUM(pv.lucro_item) as soma_lucro,
    SUM(pv.custo_producao) as soma_custo
  FROM produtos_vendas pv
  GROUP BY pv.venda_id
) sub
WHERE v.id = sub.venda_id
  AND v.created_at >= '2026-01-01'
  AND v.created_at < '2026-03-01'
  AND v.frete_aprovado = true;
```

### Portas sem correspondência
As duas portas com dimensões que excedem a tabela (5m×8.2m e 8m×8m) não serão alteradas neste momento — o LATERAL join simplesmente não as matchará, mantendo seus valores atuais.

## Impacto
- ~120 produtos atualizados (72 janeiro + 50 fevereiro)
- ~50-60 vendas com totais recalculados
- Nenhuma alteração de schema — apenas dados

