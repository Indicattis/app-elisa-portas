

## Plano: Destacar em roxo apenas os itens adicionados na correção

### Problema
Atualmente, quando `is_correcao = true`, **todos** os produtos da venda recebem estilo roxo. O correto é destacar apenas os produtos que foram inseridos pelo pedido de correção.

### Causa raiz
A tabela `produtos_vendas` não possui nenhuma coluna que identifique quais itens vieram de uma correção. Ao criar um pedido de correção, os novos produtos são inseridos com o mesmo `venda_id` do pedido original, sem marcação.

### Solução (2 partes)

**1. Migration: Adicionar coluna `pedido_correcao_id` em `produtos_vendas`**

```sql
ALTER TABLE public.produtos_vendas
  ADD COLUMN pedido_correcao_id uuid REFERENCES pedidos_producao(id) ON DELETE SET NULL;
```

**2. Atualizar `useCriarPedidoCorrecaoCompleto.ts`** — ao inserir produtos da correção, gravar o `pedido_correcao_id` (ID do novo pedido de correção) em cada produto inserido.

**3. Atualizar `PedidoViewDirecao.tsx`**:
- Remover o estilo roxo do card inteiro — voltar ao estilo padrão (`bg-primary/5 border-primary/10`)
- Na renderização de cada linha da tabela, verificar se `produto.pedido_correcao_id` existe — se sim, aplicar fundo/borda roxo naquela linha específica + um badge "Correção" ao lado da descrição
- Manter o card com estilo neutro e o ícone/badge "Correção" apenas no header

**4. Backfill dos dados existentes** — atualizar os 2 produtos de correção já existentes (criados em 2026-03-26) com o `pedido_correcao_id` correto via migration.

### Arquivos alterados
- Migration SQL (1 arquivo novo)
- `src/hooks/useCriarPedidoCorrecaoCompleto.ts` — adicionar `pedido_correcao_id` no insert
- `src/pages/direcao/PedidoViewDirecao.tsx` — estilo roxo por linha, não por card

