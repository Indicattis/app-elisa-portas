

## Plan: Add "Organograma RH" button and page

### 1. Add button to DirecaoHub

In `src/pages/direcao/DirecaoHub.tsx`, add a new menu item:
```ts
{ label: 'Organograma RH', icon: Network, path: '/direcao/gestao-colaboradores' }
```
Import `Network` from lucide-react.

### 2. Add route in App.tsx

Add route for `/direcao/gestao-colaboradores` pointing to a new page component, protected with `direcao_hub`.

### 3. Create page `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

Minimalist glassmorphism page using `MinimalistLayout` with `backPath="/direcao"` and `fullWidth`.

**Layout**: Two-panel design:
- **Left sidebar** — glassmorphism panel listing sectors from `SETOR_LABELS` (Vendas, Marketing, Instalações, Fábrica, Administrativo). Each is a clickable item with active state highlight.
- **Right content** — displays collaborators of the selected sector, fetched from `admin_users` where `role` is in `getRolesFromSetor(selectedSetor)`, ordered by role. Grouped by role with `ROLE_LABELS` as section headers.

**Data**: Uses `useAllUsers` hook (already fetches all active users). Filters client-side by sector using `SETOR_ROLES` mapping. Groups and orders by role hierarchy (order defined in `SETOR_ROLES` arrays).

**Each collaborator card**: Glassmorphism card showing avatar (`foto_perfil_url` or initials), name, role badge, and email. Uses the existing dark/glass aesthetic.

**Mobile**: On small screens, the sidebar collapses to a horizontal scrollable row of sector chips at the top, with the collaborator list below.

### Files changed
- `src/pages/direcao/DirecaoHub.tsx` — add menu item
- `src/App.tsx` — add route + lazy import
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — new page

