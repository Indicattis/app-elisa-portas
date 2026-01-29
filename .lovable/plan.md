
# Plano: Adicionar Cadastro de Catálogo e Remover Campos de Estoque

## Objetivo

1. Adicionar botão em `/vendas/catalogo` para cadastrar novo item
2. Remover campos de quantidade, unidade, estoque mínimo e peso das páginas de cadastro e edição

---

## Alterações

### 1. Arquivo: `src/pages/vendas/Catalogo.tsx`

Adicionar botão "Novo Produto" no header que navega para `/vendas/catalogo/new`

**Mudanças:**
- Importar `Plus` do lucide-react
- Importar `Button` do componente UI
- Adicionar botão após o título/subtitle

---

### 2. Novo Arquivo: `src/pages/vendas/CatalogoNovoMinimalista.tsx`

Criar página de cadastro baseada na página de edição, removendo:
- Campo de Quantidade
- Campo de Unidade
- Campo de Estoque Mínimo
- Campo de Peso

**Campos mantidos:**
- Foto do Produto
- Nome do Produto
- SKU
- Descrição
- Categoria
- Subcategoria
- Preço de Venda
- Custo
- Tipo de Fabricação
- Produto em destaque

---

### 3. Arquivo: `src/pages/vendas/CatalogoEditMinimalista.tsx`

Remover os campos:

| Campo | Linhas a Remover |
|-------|------------------|
| Quantidade | 324-331 |
| Unidade | 333-341 |
| Estoque Mín. | 342-350 |
| Peso | 376-385 |

Também remover do `formData` state inicial e do `setFormData` no `loadProduto`.

---

### 4. Arquivo: `src/hooks/useVendasCatalogo.ts`

Atualizar `ProdutoCatalogoInput` para tornar `quantidade` opcional:

```typescript
export interface ProdutoCatalogoInput {
  nome_produto: string;
  // ...
  quantidade?: number; // Tornar opcional
  // ...
}
```

No `adicionarProduto`, definir valor padrão:
```typescript
quantidade: produto.quantidade ?? 0,
```

---

### 5. Arquivo: `src/App.tsx`

Adicionar nova rota:

```typescript
import CatalogoNovoMinimalista from "./pages/vendas/CatalogoNovoMinimalista";

// Na lista de rotas:
<Route path="/vendas/catalogo/new" element={<ProtectedRoute routeKey="vendas_hub"><CatalogoNovoMinimalista /></ProtectedRoute>} />
```

---

## Resultado Esperado

### Listagem (`/vendas/catalogo`)
- Botão "Novo Produto" visível no topo
- Ao clicar, navega para `/vendas/catalogo/new`

### Formulário de Cadastro/Edição
Campos disponíveis:
| Campo | Cadastro | Edição |
|-------|----------|--------|
| Foto | ✓ | ✓ |
| Nome | ✓ | ✓ |
| SKU | ✓ | ✓ |
| Descrição | ✓ | ✓ |
| Categoria | ✓ | ✓ |
| Subcategoria | ✓ | ✓ |
| Preço de Venda | ✓ | ✓ |
| Custo | ✓ | ✓ |
| Tipo de Fabricação | ✓ | ✓ |
| Destaque | ✓ | ✓ |
| ~~Quantidade~~ | ✗ | ✗ |
| ~~Unidade~~ | ✗ | ✗ |
| ~~Estoque Mín.~~ | ✗ | ✗ |
| ~~Peso~~ | ✗ | ✗ |

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/vendas/Catalogo.tsx` | Adicionar botão |
| `src/pages/vendas/CatalogoNovoMinimalista.tsx` | **Criar** |
| `src/pages/vendas/CatalogoEditMinimalista.tsx` | Remover campos |
| `src/hooks/useVendasCatalogo.ts` | Tornar quantidade opcional |
| `src/App.tsx` | Adicionar rota |
