

## Plan: Create minimalist glassmorphism edit page for vehicles

### Overview
Create a new `FrotaEditMinimalista.tsx` page with the same dark glassmorphism theme used in `FrotaMinimalista.tsx`, and update the navigation to point to a new route `/logistica/frota/:id/editar`.

### Changes

**1. Create `src/pages/logistica/FrotaEditMinimalista.tsx`**
- Dark theme: `min-h-screen bg-black text-white`
- AnimatedBreadcrumb: Home > Logística > Frota > Editar
- Header with ArrowLeft back to `/logistica/frota`, vehicle name
- Form fields styled with glassmorphism inputs (`bg-white/5 border-white/10 text-white`)
- Two-column grid layout for form fields (same fields as VeiculoForm: foto, documento, apelido, placa, modelo, ano, responsável, km, oil dates, status)
- Photo preview and document upload with dark-themed styling
- Submit button with glassmorphism style (`bg-white/15 border-white/25`)
- Reuses `useVeiculos` hook logic for update/upload, redirects to `/logistica/frota` on success
- Loading spinner and redirect if vehicle not found

**2. Add route in `src/App.tsx`**
- Import `FrotaEditMinimalista`
- Add route: `/logistica/frota/:id/editar` → `FrotaEditMinimalista`

**3. Update `src/pages/logistica/FrotaMinimalista.tsx`**
- Change edit button navigation from `/dashboard/logistica/frota/${veiculo.id}/editar` to `/logistica/frota/${veiculo.id}/editar`

### Files affected
- `src/pages/logistica/FrotaEditMinimalista.tsx` — new file
- `src/App.tsx` — add route + import
- `src/pages/logistica/FrotaMinimalista.tsx` — update edit navigation path

