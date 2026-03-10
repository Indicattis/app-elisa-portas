

## Plan: Click-to-navigate to vehicle history + minimalist restyling

### Changes

**1. Add route in `src/App.tsx`**
- Add route `/logistica/frota/:id/conferencias` pointing to a new minimalist historico page

**2. Update `FrotaMinimalista.tsx`**
- Change `onDoubleClick` to `onClick` on table rows so a single click navigates to `/logistica/frota/${veiculoId}/conferencias`

**3. Create `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`**
- New page with the same glassmorphism dark theme used in `FrotaMinimalista.tsx`
- AnimatedBreadcrumb: Home > Logística > Frota > Histórico
- Header with ArrowLeft back to `/logistica/frota`, vehicle name, conference count
- Grid of conference cards styled with `bg-white/5 border-white/10 backdrop-blur-xl`
- Photo, date, status badge, km, oil change date, water check — same data as current `FrotaConferenciasHistorico.tsx`
- Full-screen photo dialog on click
- Loading spinner and empty state styled for dark theme

### Files affected
- `src/App.tsx` — add route
- `src/pages/logistica/FrotaMinimalista.tsx` — change double-click to single click
- `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx` — new file

