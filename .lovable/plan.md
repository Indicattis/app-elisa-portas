

# Corrigir agrupamento por porta nas ordens de PINTURA

## Problema

A funcao SQL `criar_ordem_pintura` copia linhas de producao (soldagem/perfiladeira/separacao) para criar linhas de pintura, mas NAO copia os campos `produto_venda_id` e `indice_porta`. Por isso, 201 das 283 linhas de pintura estao com esses campos NULL, impedindo o agrupamento por porta.

A PINT-00081 e um exemplo: todas as 7 linhas tem `produto_venda_id = NULL` e `indice_porta = NULL`, enquanto as linhas-fonte ja possuem os dados corretos.

## Solucao

### 1. Corrigir a funcao `criar_ordem_pintura` (para novas ordens)

Adicionar `produto_venda_id` e `indice_porta` no SELECT e no INSERT dentro do loop da funcao:

```sql
FOR v_linha IN
  SELECT 
    lo.estoque_id,
    lo.quantidade,
    lo.produto_venda_id,   -- NOVO
    lo.indice_porta,       -- NOVO
    e.nome_produto,
    e.requer_pintura
  FROM linhas_ordens lo
  JOIN estoque e ON e.id = lo.estoque_id
  WHERE ...
LOOP
  INSERT INTO linhas_ordens (
    ..., produto_venda_id, indice_porta   -- NOVO
  ) VALUES (
    ..., v_linha.produto_venda_id, v_linha.indice_porta
  );
END LOOP;
```

### 2. Backfill das linhas de pintura existentes

Como as linhas de pintura foram copiadas de linhas de producao com o mesmo `pedido_id` e `estoque_id`, podemos fazer o backfill usando match via `pedido_id` + `estoque_id` + `tipo_ordem` fonte. Porem, para pintura de porta unica (como PINT-00081) isso funciona. Para pedidos com multiplas portas, o `estoque_id` pode nao ser unico.

A abordagem mais segura: deletar e re-inserir as linhas de pintura (mesma estrategia usada com sucesso para qualidade):

```sql
DELETE FROM linhas_ordens WHERE tipo_ordem = 'pintura';

INSERT INTO linhas_ordens (
  pedido_id, ordem_id, tipo_ordem, item, quantidade,
  concluida, estoque_id, produto_venda_id, indice_porta
)
SELECT DISTINCT ON (op.id, lo.estoque_id, lo.produto_venda_id, lo.indice_porta)
  op.pedido_id, op.id, 'pintura',
  e.nome_produto, lo.quantidade,
  false, lo.estoque_id, lo.produto_venda_id, lo.indice_porta
FROM ordens_pintura op
JOIN linhas_ordens lo ON lo.pedido_id = op.pedido_id
  AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
JOIN estoque e ON e.id = lo.estoque_id
  AND e.categoria = 'componente'
  AND e.requer_pintura = true
WHERE op.historico = false;
```

**Nota**: Isso reseta `concluida` para false nas linhas de pintura.

## Nenhuma alteracao no frontend

O frontend ja suporta agrupamento por porta para todos os tipos. O problema e exclusivamente nos dados e na funcao SQL.

## Arquivos afetados

1. Nova migration SQL - corrigir funcao `criar_ordem_pintura` + backfill de dados

