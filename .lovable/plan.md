

## Plan: Add type selection step before conference/oil change

Currently the conference page goes straight to vehicle selection. The user wants an initial step where they choose between "Conferência" or "Troca de Óleo", and then proceed accordingly. The oil change flow (currently a dialog opened from the fleet list page) will be moved into this same page as a full-page flow.

### Changes to `src/pages/logistica/FrotaConferenciaMinimalista.tsx`

**New state**: `selectedType: 'conferencia' | 'troca_oleo' | null` (starts `null`).

**New Step 0 — Type Selection** (before vehicle selection):
- Two large glassmorphism cards side by side:
  - **Conferência** — with ClipboardCheck icon, subtitle "Registrar conferência do veículo"
  - **Troca de Óleo** — with Droplet icon, subtitle "Registrar troca de óleo"
- Clicking sets `selectedType` and proceeds to vehicle selection (Step 1)

**Step 1 — Vehicle Selection**: Same as today, shown for both types.

**If type is `conferencia`**: Steps 2 and 3 remain identical (photo capture → form → submit).

**If type is `troca_oleo`**: After vehicle selection, skip photo capture and show an inline form (not a dialog) with:
- Date picker (data da troca) — using a simple `<Input type="date">` to keep it consistent with the page style
- Read-only fields: KM Atual, KM Próxima Troca (+5000), Data Próxima Troca (+6 months)
- Submit calls `updateVeiculo` with the oil change data (same logic as `TrocaOleoDialog`)
- After success, navigates back to `/logistica/frota`

**Back button logic** updated: from form → vehicle select → type select → `/logistica/frota`.

**Subtitle** updated dynamically: "Selecione o tipo", "Selecione o veículo", etc.

**Import** `useVeiculos` `updateVeiculo` (already available via the hook). Add `Droplet`, `ClipboardCheck` icons. Add `addMonths`, `format` from date-fns.

### No changes needed to `TrocaOleoDialog.tsx`
It can remain for backward compatibility but won't be used from the fleet list page anymore (or can be removed in a follow-up cleanup).

### Single file change
Only `src/pages/logistica/FrotaConferenciaMinimalista.tsx` is modified.

