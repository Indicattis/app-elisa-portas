
# Adicionar pagina de gestao de cores em /vendas/catalogo/cores

## Resumo

Adicionar um botao no header do catalogo que leva a uma nova pagina dedicada a gestao de cores, reutilizando o hook `useCatalogoCores` ja existente.

## Alteracoes

### 1. Botao no header do Catalogo (`src/pages/vendas/Catalogo.tsx`)

Adicionar um botao com icone `Palette` ao lado do botao "Novo Produto" no `headerActions`, direcionando para `/vendas/catalogo/cores`.

### 2. Nova pagina de Cores (`src/pages/vendas/CatalogoCores.tsx`)

Criar pagina usando `MinimalistLayout` com breadcrumbs (Home > Vendas > Catalogo > Cores). Funcionalidades:

- Listar cores existentes com preview da cor (circulo colorido), nome e codigo hex
- Botao para adicionar nova cor (dialog/modal com campos nome, codigo hex com color picker, e toggle ativa/inativa)
- Editar cor existente (mesmo modal)
- Toggle para ativar/desativar cor
- Reutilizar o hook `useCatalogoCores` que ja possui todas as mutations necessarias (adicionar, editar, toggleAtiva)

### 3. Rota no App.tsx

Registrar a nova rota `/vendas/catalogo/cores` com `ProtectedRoute routeKey="vendas_hub"`, ao lado das outras rotas do catalogo.

## Detalhes tecnicos

### Catalogo.tsx - headerActions
```typescript
headerActions={
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      onClick={() => navigate('/vendas/catalogo/cores')}
      className="border-white/20 text-white hover:bg-white/10"
    >
      <Palette className="w-4 h-4 mr-2" />
      Cores
    </Button>
    <Button
      onClick={() => navigate('/vendas/catalogo/new')}
      className="bg-gradient-to-r from-green-500 to-green-700 ..."
    >
      <Plus className="w-4 h-4 mr-2" />
      Novo Produto
    </Button>
  </div>
}
```

### CatalogoCores.tsx - Estrutura principal
- `MinimalistLayout` com tema escuro consistente
- Lista de cores em grid/cards com circulo colorido, nome, hex, badge ativa/inativa
- Dialog para criar/editar cor com input de nome, input color para hex, switch ativa
- Usa `useCatalogoCores()` para dados e mutations

### App.tsx - Nova rota
```typescript
<Route path="/vendas/catalogo/cores" element={
  <ProtectedRoute routeKey="vendas_hub"><CatalogoCores /></ProtectedRoute>
} />
```

### Arquivos
1. `src/pages/vendas/Catalogo.tsx` - Adicionar botao Cores no header
2. `src/pages/vendas/CatalogoCores.tsx` - Nova pagina (criar)
3. `src/App.tsx` - Registrar rota
