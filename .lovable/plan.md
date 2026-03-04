

# Remover sistema de categorias e subcategorias das despesas

## Escopo

Remover toda a lógica de categorias/subcategorias da página `/direcao/dre/despesas` e do hook `useTiposCustos`. Isso inclui:

## Alterações

### 1. `src/pages/direcao/DREDespesasDirecao.tsx`
- Remover botão "Categorias" do header (linha 119-121)
- Remover filtro de categoria do search bar (linhas 140-146)
- Remover coluna "Categoria" da tabela (linha 165, 178, 192)
- Remover campos categoria/subcategoria do dialog de tipo de custo (linhas 229-244)
- Remover todo o dialog "Categorias Manager" com abas categorias/subcategorias (linhas 269-344)
- Remover dialog de criação/edição de categoria (linhas 346-372)
- Remover dialog de criação/edição de subcategoria (linhas 374-400)
- Remover states: `categoriasManagerDialog`, `categoriaDialog`, `subcategoriaDialog`, `editingCategoria`, `editingSubcategoria`, `categoriaForm`, `subcategoriaForm`, `filterCategoria`
- Remover funções: `handleSaveCategoria`, `handleSaveSubcategoria`, `handleEditCategoria`, `handleEditSubcategoria`, `toggleCategoriaStatus`, `toggleSubcategoriaStatus`, `resetCategoriaForm`, `resetSubcategoriaForm`
- Remover `categoria_id`/`subcategoria_id` do `tipoCustoForm` e `handleSaveTipoCusto`
- Atualizar `filteredTiposCustos` para não filtrar por categoria
- Ajustar `colSpan` na linha de totais de 2 para 1

### 2. `src/hooks/useTiposCustos.ts`
- Remover `CustoCategoria` e `CustoSubcategoria` interfaces
- Remover `categoria_id`/`subcategoria_id` do `TipoCusto` interface
- Remover states `categorias` e `subcategorias`
- Remover funções `fetchCategorias`, `fetchSubcategorias` e todas as CRUD de categorias/subcategorias
- Simplificar `fetchTiposCustos` para não fazer join com categorias/subcategorias
- Remover exports de categorias/subcategorias

