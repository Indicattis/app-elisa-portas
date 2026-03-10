

## Plan: Add blue accent details to Frota pages

Subtle blue accents across the three minimalist frota pages, applied to interactive elements, borders, and highlights while keeping the dark glassmorphism base.

### Color tokens
Use `blue-500` / `blue-400` with low opacity for accents: `border-blue-500/20`, `text-blue-400`, `bg-blue-500/10`, `hover:bg-blue-500/15`.

### Files and changes

**1. `src/pages/logistica/FrotaMinimalista.tsx`**
- Header border-b: `border-white/10` → `border-blue-500/20`
- Title "Frota": add `text-blue-400` tint
- "Troca Óleo" button: `border-blue-500/30 hover:border-blue-400/40`
- "Novo" button: `bg-blue-500/15 border-blue-500/25 hover:bg-blue-500/25`
- Table header row: `border-blue-500/10`
- Table row hover: `hover:bg-blue-500/5`
- Edit icon button hover: `hover:bg-blue-500/10 hover:text-blue-400`
- Loading spinner: `border-b-2 border-blue-400`
- Card border: `border-blue-500/10`

**2. `src/pages/logistica/FrotaEditMinimalista.tsx`**
- Header border-b: `border-blue-500/20`
- Title "Editar Veículo": `text-blue-400` tint or keep white
- Save button: `bg-blue-500/15 border-blue-500/25 hover:bg-blue-500/25`
- Input focus: `focus:border-blue-400/40 focus-visible:ring-blue-400/20`
- Card borders: `border-blue-500/10`
- Photo upload dashed border hover: `hover:border-blue-400/40`
- Section divider: `border-blue-500/10`
- Loading spinner: `border-b-2 border-blue-400`

**3. `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`**
- Header border-b: already uses `border-primary/10` — update to `border-blue-500/20`
- Back button hover: `hover:bg-blue-500/10`
- Card borders if any: `border-blue-500/10`

### Summary
Three files touched with class name updates only — no logic changes. Adds a cohesive blue accent layer across headers, borders, buttons, and interactive states.

