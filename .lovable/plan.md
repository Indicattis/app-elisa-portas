

## Diagnóstico: Ranking de equipes vazio

### Problema identificado

A query no hook `useRankingEquipesInstalacao.ts` filtra instalações com **ambas** as condições:
- `responsavel_instalacao_id IS NOT NULL`
- `pedido_id IS NOT NULL`

Porém, os dados mostram que as instalações concluídas têm **ou** `responsavel_instalacao_id` preenchido (com `pedido_id` nulo) **ou** `pedido_id` preenchido (com `responsavel_instalacao_id` nulo). A combinação AND retorna zero resultados.

Existem 18 instalações concluídas com `responsavel_instalacao_id` preenchido que deveriam aparecer no ranking.

### Correção

**Arquivo:** `src/hooks/useRankingEquipesInstalacao.ts`

Remover o filtro `.not('pedido_id', 'is', null)` da query de instalações (linha 70), mantendo apenas o filtro de `responsavel_instalacao_id` que é o campo relevante para associar a equipe.

**Antes:**
```ts
.eq('instalacao_concluida', true)
.eq('tipo_instalacao', 'elisa')
.not('responsavel_instalacao_id', 'is', null)
.not('pedido_id', 'is', null);
```

**Depois:**
```ts
.eq('instalacao_concluida', true)
.eq('tipo_instalacao', 'elisa')
.not('responsavel_instalacao_id', 'is', null);
```

