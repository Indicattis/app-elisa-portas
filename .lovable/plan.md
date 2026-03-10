

## Plan: Modify Fleet Table Columns and Status

### Changes

**1. Database Migration** — Add `responsavel` column to `veiculos` table:
```sql
ALTER TABLE public.veiculos ADD COLUMN responsavel TEXT;
```
Also update the status CHECK constraint to allow only `rodando`, `mecanico`, `parado` (replacing old values).

**2. Update `StatusBadge` (`src/components/frota/StatusBadge.tsx`)**:
- Replace all status options with only 3:
  - `rodando` → green badge
  - `mecanico` → gray badge
  - `parado` → red badge

**3. Update `useVeiculos.ts`**:
- Add `responsavel` to `Veiculo` interface and `VeiculoFormData`
- Update status type to `'rodando' | 'mecanico' | 'parado'`
- Remove `calcularStatusVeiculo` logic (no longer needed since status is now simple)

**4. Update `Frota.tsx`** — Reorder columns to:
| Foto | Modelo | Placa | Ano | Apelido | Responsável | Km Atual | Próx. Troca Óleo | Status | Ações |

- Rename "Nome" header to "Apelido"
- Add "Responsável" column showing `veiculo.responsavel`
- Remove columns: Última Troca Óleo, KM Próx. Troca, Última Conferência
- Use `veiculo.status` directly instead of `calcularStatusVeiculo`

**5. Update vehicle form** (if exists) to include `responsavel` field and new status options.

### Files affected
- New migration SQL file
- `src/components/frota/StatusBadge.tsx`
- `src/hooks/useVeiculos.ts`
- `src/pages/Frota.tsx`
- Vehicle form components (if any)

