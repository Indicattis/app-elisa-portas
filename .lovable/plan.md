

## Plan: Refactor FrotaMinimalista header to use MinimalistLayout

The MinhasVendas page uses `MinimalistLayout` which provides a consistent header design: a floating back button (blue gradient), animated breadcrumb, and a glassmorphism header card (`bg-white/5 backdrop-blur-xl border border-white/10`) with title + action buttons on the right.

FrotaMinimalista currently has a custom inline header. The fix is to wrap it in `MinimalistLayout` like MinhasVendas does.

### Change in `src/pages/logistica/FrotaMinimalista.tsx`

1. Replace the manual `AnimatedBreadcrumb`, back button, and `<header>` block with `MinimalistLayout`
2. Pass props:
   - `title="Frota"`
   - `subtitle="Gerencie os veículos da empresa"`
   - `backPath="/logistica"`
   - `breadcrumbItems` with Home > Logística > Frota
   - `headerActions` containing the three buttons (Conferir, Troca Óleo, Novo) — restyled to match MinhasVendas button style (`h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 shadow-lg shadow-blue-500/30 hover:scale-[1.02]`)
3. Move the `<main>` content into the `children` of `MinimalistLayout`
4. Remove the now-unnecessary `AnimatedBreadcrumb` import, manual `mounted` state, and manual header/back button code

### Buttons styling (matching MinhasVendas)
- **Novo**: `bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 shadow-lg shadow-blue-500/30`
- **Troca Óleo**: `bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/20` (secondary style)
- **Conferir**: same secondary style as Troca Óleo

### Files affected
- `src/pages/logistica/FrotaMinimalista.tsx` — refactor to use `MinimalistLayout`

