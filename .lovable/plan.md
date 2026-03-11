

## Plan: Fix conferência status constraint violation

**Problem**: `FrotaConferencia.tsx` line 59 sends the vehicle's status (`'rodando'`, `'mecanico'`, `'parado'`) as the conferência status, but `veiculos_conferencias` only accepts `'pronto'`, `'atencao'`, `'critico'`, `'mecanico'`, `'em_uso'`.

**Fix in `src/pages/FrotaConferencia.tsx`**: Map the vehicle status to a valid conferência status before inserting:
- `'rodando'` → `'em_uso'`
- `'mecanico'` → `'mecanico'` (already valid)
- `'parado'` → `'pronto'`

Change line 59 from:
```ts
status: veiculo?.status || 'rodando'
```
to a mapped value using the vehicle's current status.

Single line change, one file.

