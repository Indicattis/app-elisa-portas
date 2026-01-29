
# Plano: Adicionar Botão "Novo Produto" e Remover Campos de Estoque

## Problema
As alterações solicitadas anteriormente não foram aplicadas aos arquivos.

---

## Alterações Necessárias

### 1. `src/pages/vendas/Catalogo.tsx`

**Adicionar:**
- Import de `Plus` do lucide-react
- Import de `Button` do componente UI
- Botão "Novo Produto" no header

**Mudança específica:**
```typescript
// Linha 3 - adicionar Plus ao import
import { Search, BookOpen, Star, Package, Plus } from 'lucide-react';

// Linha 12 (novo import)
import { Button } from '@/components/ui/button';

// No MinimalistLayout, adicionar prop headerRight com o botão
```

---

### 2. `src/pages/vendas/CatalogoEditMinimalista.tsx`

**Remover do formData (linhas 47-63):**
- `quantidade: 0`
- `unidade: "un"`
- `estoque_minimo: 0`
- `peso: undefined`

**Remover do loadProduto setFormData (linhas 83-99):**
- `quantidade: data.quantidade`
- `unidade: data.unidade || "un"`
- `estoque_minimo: data.estoque_minimo || 0`
- `peso: data.peso || undefined`

**Remover seção de Estoque (linhas 321-386):**
- Campo Quantidade
- Campo Unidade
- Campo Estoque Mín.
- Campo Peso

**Manter apenas:** Preço de Venda e Custo

---

### 3. Criar `src/pages/vendas/CatalogoNovoMinimalista.tsx`

Página de cadastro sem os campos de estoque.

---

### 4. `src/App.tsx`

Adicionar rota `/vendas/catalogo/new` → `CatalogoNovoMinimalista`

---

### 5. `src/hooks/useVendasCatalogo.ts`

Tornar `quantidade` opcional na interface e definir valor padrão 0 no insert.

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/vendas/Catalogo.tsx` | Adicionar botão |
| `src/pages/vendas/CatalogoEditMinimalista.tsx` | Remover 4 campos |
| `src/pages/vendas/CatalogoNovoMinimalista.tsx` | **Criar** |
| `src/hooks/useVendasCatalogo.ts` | Atualizar interface |
| `src/App.tsx` | Adicionar rota |
