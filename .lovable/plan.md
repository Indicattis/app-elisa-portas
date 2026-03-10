

## Plan: Create minimalist vehicle conference page

Recreate the vehicle conference flow (`FrotaConferencia`) with the dark glassmorphism + blue accents style, and add a button in the fleet list to access it.

### Flow (3 steps, same as original)
1. **Select vehicle** — grid of vehicle cards
2. **Capture photo** — file input with camera capture
3. **Fill form** — km, oil date, water check, oil level check, observations, submit

### Files

**1. Create `src/pages/logistica/FrotaConferenciaMinimalista.tsx`**
- Dark theme (`bg-black text-white`), glassmorphism cards (`bg-white/5 border-blue-500/10 backdrop-blur-xl`)
- AnimatedBreadcrumb: Home > Logística > Frota > Conferência
- Step 1: Vehicle grid cards with photo, name, model, status badge — click selects
- Step 2: Camera capture area with dark-styled file input, blue accent upload button
- Step 3: Form with `inputClass` pattern from edit page, checkboxes for água/óleo, submit button `bg-blue-500/15 border-blue-500/25`
- Uses `useVeiculos` and `useConferencias` hooks
- On success navigates to `/logistica/frota`

**2. Update `src/App.tsx`**
- Import `FrotaConferenciaMinimalista`
- Add route: `/logistica/frota/conferencia`

**3. Update `src/pages/logistica/FrotaMinimalista.tsx`**
- Add a "Conferir" button next to the existing "Troca Óleo" and "Novo" buttons in the header, navigating to `/logistica/frota/conferencia`

### Files affected
- `src/pages/logistica/FrotaConferenciaMinimalista.tsx` — new file
- `src/App.tsx` — add route
- `src/pages/logistica/FrotaMinimalista.tsx` — add button

