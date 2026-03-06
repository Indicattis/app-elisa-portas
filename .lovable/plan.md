

# Fix: Search results hidden behind section below

## Problem
The search results dropdown in the order search field has `z-50` but the parent `Section` component likely creates a stacking context that clips or overlaps it. The next section ("Produtos da Correção") renders on top.

## Solution
Add `relative z-10` (or `overflow-visible`) to the parent `Section` wrapper of the search field, or more simply, add `overflow-visible` and a higher `z-index` to the `<Section>` containing the search, ensuring the dropdown isn't clipped.

**File: `src/pages/vendas/PedidoCorrecaoNovo.tsx`**

- On the `<div className="relative">` wrapping the search input (line 203), it already has `relative` — that's fine.
- The issue is the parent `<Section>` likely has `overflow-hidden` or creates a stacking context. The fix: wrap the search section's content in a container with a higher z-index, or ensure the Section around the search (line 238) gets `className="relative z-20 overflow-visible"` while the Produtos section below stays at default z-index.

Concrete change: Add `className="relative z-20 overflow-visible"` prop to the Section containing the search, or add a wrapper `div` with those classes around lines 188-238 if Section doesn't accept className. Also check the Section component to see if it applies `overflow-hidden`.

