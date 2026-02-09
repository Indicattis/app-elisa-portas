

# Corrigir erro de retorno da Qualidade para Producao

## Problema

A funcao SQL `retornar_pedido_para_producao` faz um `INSERT` direto na tabela `pedidos_etapas` (linha 145-146), sem tratar o caso em que o registro `(pedido_id, em_producao)` ja existe. Como o pedido ja passou por essa etapa antes, a constraint `pedidos_etapas_pedido_id_etapa_unique` impede a insercao duplicada.

## Causa raiz

```sql
-- Linha 145-146 da funcao atual (ERRADO)
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb);
```

Deveria usar `ON CONFLICT ... DO UPDATE` (UPSERT), como ja documentado na memoria do projeto (`database-pedidos-etapas-integrity`).

## Solucao

Substituir o `INSERT` por um `INSERT ... ON CONFLICT` que reativa a etapa existente:

```sql
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb)
ON CONFLICT (pedido_id, etapa) DO UPDATE SET
  data_entrada = now(),
  data_saida = NULL,
  checkboxes = '[]'::jsonb;
```

Isso limpa a `data_saida`, reseta os checkboxes e atualiza a `data_entrada`, permitindo que a etapa seja revisitada sem violar a constraint.

## Detalhe tecnico

### Nova migracao SQL

Recriar a funcao `retornar_pedido_para_producao` com a unica alteracao sendo o UPSERT na linha 145-146. Todo o restante da funcao permanece identico.

## Arquivos modificados

1. **Nova migracao SQL**: `CREATE OR REPLACE FUNCTION retornar_pedido_para_producao` -- corrigir INSERT para UPSERT com ON CONFLICT

