

## Plan: Add notice/warning system for vehicles (Avisos)

Similar to the "Aviso de Espera" system in production orders, this adds two columns to the `veiculos` table and integrates a warning indicator + modal in the fleet list page.

### 1. Database Migration

Add two nullable columns to `veiculos`:

```sql
ALTER TABLE veiculos ADD COLUMN aviso_justificativa TEXT DEFAULT NULL;
ALTER TABLE veiculos ADD COLUMN aviso_data TIMESTAMPTZ DEFAULT NULL;
```

### 2. Update `useVeiculos` hook

- Add `aviso_justificativa` and `aviso_data` to the `Veiculo` interface
- No query changes needed (already uses `select *`)

### 3. Create `AvisoVeiculoModal` component

Reuse the same pattern as `AvisoEsperaModal` from pedidos:
- Props: `open`, `onOpenChange`, `veiculoNome`, `avisoAtual`, `avisoData`, `onSalvar`, `onRemover`
- Textarea for justification, save/remove buttons
- Shows timestamp of when notice was registered

### 4. Update `FrotaMinimalista.tsx`

- Add a new **Aviso** column in the table (between Status and Ações)
- Show an amber warning icon (AlertTriangle) if `aviso_justificativa` exists, otherwise "-"
- Add a small button in the actions column (MessageSquareWarning icon) to open the modal
- Row gets an amber left border when notice is active: `border-l-2 border-l-amber-500`
- Wire modal to call `updateVeiculo` with `aviso_justificativa` and `aviso_data` fields
- On save: set both fields; on remove: set both to `null`

### 5. Update `Frota.tsx` (dashboard version)

Same changes as FrotaMinimalista for consistency.

### Files changed
- **Migration**: add 2 columns to `veiculos`
- `src/hooks/useVeiculos.ts` — update interface
- `src/components/frota/AvisoVeiculoModal.tsx` — new file
- `src/pages/logistica/FrotaMinimalista.tsx` — add column + modal
- `src/pages/Frota.tsx` — add column + modal

