

# Corrigir backfill de linhas de qualidade com dados de porta corretos

## Problema raiz

A migration de backfill (Parte 2) usou apenas `estoque_id` para fazer o match entre `linhas_ordens` e `pedido_linhas`. Como o mesmo `estoque_id` aparece em multiplas combinacoes de `produto_venda_id` + `indice_porta` (ex: "Meia cana lisa" existe nas 7 portas), o UPDATE do PostgreSQL atribuiu valores arbitrarios, resultando em apenas 3 grupos distintos ao inves de 7.

Dados atuais em `linhas_ordens` (qualidade):
- `77df3fe8...` / indice 0 -> 15 linhas
- `8decab36...` / indice 0 -> 8 linhas  
- `bb26e29e...` / indice 2 -> 13 linhas (deveria haver indice 0, 1 e 2)

Dados corretos em `pedido_linhas`: 7 combinacoes distintas de `produto_venda_id` + `indice_porta`.

## Solucao

### Migration SQL

A unica forma confiavel de corrigir e deletar as linhas de qualidade existentes e re-inseri-las a partir de `pedido_linhas` com os dados corretos. Para cada ordem de qualidade afetada:

1. Identificar a `ordem_id` da ordem de qualidade
2. Deletar todas as `linhas_ordens` dessa ordem
3. Re-inserir a partir de `pedido_linhas` filtrando por `categoria_linha IN ('solda', 'perfiladeira')`, copiando `produto_venda_id` e `indice_porta`

```sql
-- Para TODAS as ordens de qualidade (nao apenas este pedido),
-- deletar e recriar as linhas a partir de pedido_linhas

-- 1. Deletar linhas de qualidade existentes
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'qualidade';

-- 2. Reinserir corretamente a partir de pedido_linhas
INSERT INTO linhas_ordens (
  pedido_id, ordem_id, tipo_ordem, item, quantidade,
  tamanho, concluida, estoque_id, produto_venda_id, indice_porta
)
SELECT
  oq.pedido_id,
  oq.id,
  'qualidade',
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1),
  COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text),
  false,
  pl.estoque_id,
  pl.produto_venda_id,
  pl.indice_porta
FROM ordens_qualidade oq
JOIN pedido_linhas pl ON pl.pedido_id = oq.pedido_id
  AND pl.categoria_linha IN ('solda', 'perfiladeira')
WHERE oq.historico = false;
```

**Nota importante**: Isso reseta o campo `concluida` para `false` em todas as linhas de qualidade. Se houver ordens ja parcialmente concluidas, esse estado sera perdido. Para minimizar impacto, podemos limitar apenas a ordens com status `'pendente'` ou `'em_andamento'`.

### Nenhuma alteracao no frontend

O frontend ja esta usando a chave composta `produto_venda_id` + `indice_porta` para agrupamento. O problema e exclusivamente nos dados do banco.

## Arquivos afetados

1. Nova migration SQL (delete + re-insert das linhas de qualidade)

