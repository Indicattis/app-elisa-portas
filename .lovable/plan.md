

## Plan: Replace "Aviso" column with weekly conference check indicator

The current "Aviso" column (justificativa/data system) will be replaced with a "Últ. Conferência" column that shows the date of the last conference for each vehicle, color-coded:
- **Green**: last conference is from the current week (since last Monday)
- **Red**: no conference since last Monday (or never)

### Already available data
The `useVeiculos` hook already joins `veiculos_conferencias` and maps `ultima_conferencia_data`. However, it doesn't order the conferences — need to fix this to ensure the latest one is picked.

### Changes

**1. `src/hooks/useVeiculos.ts`**
- Fix the query to order conferences by `created_at` descending so `[0]` is the most recent
- Remove `aviso_justificativa` and `aviso_data` from the `Veiculo` interface (clean up)

**2. `src/pages/logistica/FrotaMinimalista.tsx`**
- Replace the "Aviso" column header with "Últ. Conferência"
- Replace the amber warning icon cell with the formatted date of `ultima_conferencia_data`
- Add a helper function `isConferenciaEmDia(date)` that checks if the date is on or after last Monday (using `startOfWeek` from date-fns with `weekStartsOn: 1`)
- Show date text in `text-green-400` if em dia, `text-red-400` if not, or "Nunca" in red if null
- Remove all aviso modal state, imports, and the `AvisoVeiculoModal` integration
- Remove the `MessageSquareWarning` action button from the actions column
- Remove the amber left border styling on rows

**3. `src/pages/Frota.tsx`** — Same column changes for consistency

**4. Cleanup** — The `AvisoVeiculoModal` component and the DB columns (`aviso_justificativa`, `aviso_data`) can remain for now (no harm), or be removed via migration. I'll leave them since removing columns is destructive.

### No database changes needed
The conference data is already being fetched. Only frontend logic changes.

