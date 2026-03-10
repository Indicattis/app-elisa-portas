

## Plan: Refactor 3 pages to use MinimalistLayout header

All three pages currently use a custom header with manual `AnimatedBreadcrumb` + back button + sticky header bar. They need to be wrapped in `MinimalistLayout` to match the design of `/logistica/frota`.

### 1. `src/pages/logistica/FrotaEditMinimalista.tsx`
- Replace manual breadcrumb (lines 121-129), back button, and header (lines 131-153) with `MinimalistLayout`
- Props: `title="Editar Veículo"`, `subtitle="{veiculo.nome} — {veiculo.modelo}"`, `backPath="/logistica/frota"`
- `headerActions`: the "Salvar" button
- `breadcrumbItems`: Home > Logística > Frota > Editar
- Remove `mounted` state, `AnimatedBreadcrumb` import, manual `ArrowLeft` back button
- Content (`<main>`) becomes children of `MinimalistLayout`

### 2. `src/pages/logistica/FrotaConferenciaMinimalista.tsx`
- Replace manual breadcrumb (lines 108-116) and header (lines 118-133) with `MinimalistLayout`
- Props: `title="Conferência"`, `subtitle={stepTitle}`, `backPath` handled by custom `handleBack`
- Since this page has a custom back behavior (step-based), set `showBackButton=false` and keep an inline back button in `headerActions`, or override `backPath` dynamically
- Actually simpler: use `MinimalistLayout` with `showBackButton={false}` and put a back button + title info in `headerActions` — but that breaks the layout pattern. Better approach: use `MinimalistLayout` with dynamic back behavior by not using the built-in back button and adding a custom one in headerActions.
- Simplest: wrap in `MinimalistLayout` with `title="Conferência"`, `subtitle={stepTitle}`, `backPath="/logistica/frota"`, and breadcrumb. The built-in back button always goes to `/logistica/frota` which is acceptable (user can also use browser back for step navigation).
- `breadcrumbItems`: Home > Logística > Frota > Conferência

### 3. `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`
- Replace manual breadcrumb (lines 28-36) and header (lines 38-58) with `MinimalistLayout`
- Props: `title` dynamic based on loading/veiculo state, `subtitle="{count} conferências registradas"`, `backPath="/logistica/frota"`
- `breadcrumbItems`: Home > Logística > Frota > Histórico
- Remove `mounted` state, manual back button
- Content stays as children

### Files affected
- `src/pages/logistica/FrotaEditMinimalista.tsx`
- `src/pages/logistica/FrotaConferenciaMinimalista.tsx`
- `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`

