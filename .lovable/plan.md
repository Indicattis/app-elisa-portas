

## Plano: Botão "Gestão de Frotas" no Hub da Direção + Página clone

### Resumo
Adicionar um botão "Gestão de Frotas" no hub `/direcao` acima de "Estoque", e criar uma página clone de `/logistica/frota` em `/direcao/frota` com breadcrumbs e navegação adaptados para o contexto da Direção.

### Mudanças

**1. `src/pages/direcao/DirecaoHub.tsx`**
- Adicionar item `{ label: 'Gestão de Frotas', icon: Truck, path: '/direcao/frota', routePrefix: 'direcao_frota' }` no array `menuItems`, antes de "Estoque" (posição index 7)

**2. Novo: `src/pages/direcao/FrotaDirecao.tsx`**
- Clone de `FrotaMinimalista.tsx` com:
  - `backPath` alterado para `/direcao`
  - Breadcrumbs: Home > Direção > Gestão de Frotas
  - Rotas de navegação internas apontando para `/direcao/frota/...` em vez de `/logistica/frota/...`

**3. `src/App.tsx`**
- Adicionar rotas para `/direcao/frota`, `/direcao/frota/novo`, `/direcao/frota/:id/editar`, `/direcao/frota/:id/conferencias`, `/direcao/frota/conferencia`
- Reutilizar os componentes existentes de edição/conferência (FrotaNovoMinimalista, FrotaEditMinimalista, etc.) com `routeKey="direcao_hub"`

### Arquivos alterados
- `src/pages/direcao/DirecaoHub.tsx`
- Novo: `src/pages/direcao/FrotaDirecao.tsx`
- `src/App.tsx`

