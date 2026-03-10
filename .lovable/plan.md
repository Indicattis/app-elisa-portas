

## Plan: Create dedicated "Novo Veículo" page

The "Novo" button navigates to `/dashboard/logistica/frota/novo` but no route exists for that path, causing a fallback to `/home`. Need to create a new page and register the route.

### Approach
Create `src/pages/logistica/FrotaNovoMinimalista.tsx` based on the edit page (`FrotaEditMinimalista.tsx`) but adapted for creation:

### 1. New file: `src/pages/logistica/FrotaNovoMinimalista.tsx`
- Same structure as `FrotaEditMinimalista.tsx` using `MinimalistLayout`
- Title: "Novo Veículo", subtitle: "Cadastre um novo veículo da frota"
- Breadcrumb: Home > Logística > Frota > Novo
- `backPath="/logistica/frota"`
- Header action: "Cadastrar" button (instead of "Salvar")
- Form fields: Modelo, Apelido, Placa, Ano, Responsável, Status (same as edit page)
- Photo and document upload sections (same as edit page)
- No read-only fields (Km Atual, Última Troca, Próx. Troca) since it's a new vehicle
- Uses `createVeiculo` from `useVeiculos` instead of `updateVeiculo`
- After successful creation, navigates to `/logistica/frota`

### 2. Update routing in `src/App.tsx`
- Import `FrotaNovoMinimalista`
- Add route: `/logistica/frota/novo` with `ProtectedRoute routeKey="logistica_hub"`
- Place it BEFORE the `/:id/editar` route to avoid "novo" matching as an `:id`

### 3. Fix navigate path in `src/pages/logistica/FrotaMinimalista.tsx`
- Change `navigate('/dashboard/logistica/frota/novo')` to `navigate('/logistica/frota/novo')` (the `/dashboard` prefix doesn't match the route definitions)

