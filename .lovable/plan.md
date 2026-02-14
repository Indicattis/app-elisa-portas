
# Corrigir calculo de metros quadrados na Pintura

## Problema
O ranking de pintura por m2 em "Desempenho por Etapa" mostra 0 m2 porque:

1. As funcoes SQL (`get_portas_por_etapa` e `get_desempenho_etapas`) tentam buscar `largura` e `altura` da tabela `pedido_linhas`, mas essa tabela nao tem esses dados preenchidos (todos NULL)
2. As dimensoes reais das portas estao na tabela `produtos_vendas` (vinculada via `pedidos_producao.venda_id`)
3. A coluna `metragem_quadrada` em `ordens_pintura` tambem nao e preenchida na criacao (quase todas com valor 0)

## Solucao

### 1. Corrigir as funcoes SQL de ranking

Alterar ambas as funcoes para calcular m2 a partir de `produtos_vendas` em vez de `pedido_linhas`:

**Logica atual (errada):**
```text
SELECT SUM(pl.largura * pl.altura / 1000000.0)
FROM ordens_pintura op
JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
WHERE ...
```

**Logica corrigida:**
```text
SELECT SUM(pv.largura * pv.altura)
FROM ordens_pintura op
JOIN pedidos_producao pp ON pp.id = op.pedido_id
JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
  AND pv.largura IS NOT NULL
  AND pv.altura IS NOT NULL
WHERE op.status = 'pronta'
  AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
```

Nota: as dimensoes em `produtos_vendas` ja estao em metros (ex: 5.58 x 5.8), entao nao e necessario dividir por 1000000.

### 2. Atualizar `criar_ordem_pintura` para preencher `metragem_quadrada`

Adicionar calculo automatico da metragem ao criar a ordem:
```text
UPDATE ordens_pintura SET metragem_quadrada = (
  SELECT COALESCE(SUM(pv.largura * pv.altura), 0)
  FROM produtos_vendas pv
  WHERE pv.venda_id = v_venda_id
    AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
) WHERE id = v_ordem_id;
```

### 3. Backfill das ordens existentes

Atualizar todas as `ordens_pintura` existentes que tem `metragem_quadrada = 0`:
```text
UPDATE ordens_pintura op SET metragem_quadrada = (
  SELECT COALESCE(SUM(pv.largura * pv.altura), 0)
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = op.pedido_id
    AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
) WHERE op.metragem_quadrada = 0 OR op.metragem_quadrada IS NULL;
```

## Secao Tecnica

### Arquivo afetado
- 1 migration SQL contendo:
  - `CREATE OR REPLACE FUNCTION get_portas_por_etapa` — corrigir subquery de pintura_m2
  - `CREATE OR REPLACE FUNCTION get_desempenho_etapas` — corrigir subquery de pintura_m2 por colaborador
  - `CREATE OR REPLACE FUNCTION criar_ordem_pintura` — adicionar calculo de metragem_quadrada
  - UPDATE de backfill para ordens existentes

### Impacto
- Nenhuma alteracao de codigo frontend necessaria (os hooks e componentes ja exibem corretamente o valor retornado)
- O ranking passara a mostrar dados imediatamente apos o backfill
- Novas ordens terao metragem calculada automaticamente
