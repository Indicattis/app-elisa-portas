

## Plan: Create minimalist glassmorphism edit page for vehicles

### Overview
Create a new page at `/logistica/frota/:id/editar` with the same dark glassmorphism theme, containing an inline form (no reuse of VeiculoForm to avoid light-theme styling conflicts). Update the edit button navigation in FrotaMinimalista.

### 1. Create `src/pages/logistica/FrotaEditMinimalista.tsx`

Full-page dark glassmorphism edit form:
- `min-h-screen bg-black text-white`
- AnimatedBreadcrumb: Home > Logística > Frota > Editar
- Header with ArrowLeft back to `/logistica/frota` and vehicle name
- Glass card (`bg-white/5 border-white/10 backdrop-blur-xl`) containing form fields
- All inputs styled: `bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30`
- All labels styled: `text-white/70`
- Two-column grid with fields: Foto, Documento, Apelido, Placa, Modelo, Ano, Responsável, Km Atual (disabled), Datas de óleo (disabled), Status (disabled)
- Photo preview with dark styling, document upload with dark styling
- Save button: `bg-white/15 border-white/25 hover:bg-white/25`
- Uses `useVeiculos` hook for data fetching, update, and uploads
- Redirects to `/logistica/frota` on save success
- Select dropdown for status uses dark theme overrides

### 2. Update `src/App.tsx`
- Import `FrotaEditMinimalista`
- Add route: `/logistica/frota/:id/editar` with ProtectedRoute

### 3. Update `src/pages/logistica/FrotaMinimalista.tsx`
- Change edit button navigation from `/dashboard/logistica/frota/${veiculo.id}/editar` to `/logistica/frota/${veiculo.id}/editar`

### Files affected
- `src/pages/logistica/FrotaEditMinimalista.tsx` — new file
- `src/App.tsx` — add route + import
- `src/pages/logistica/FrotaMinimalista.tsx` — update edit navigation path

