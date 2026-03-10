

## Plan: Swap Apelido and Modelo column data

The "Modelo" column currently shows `veiculo.modelo` and "Apelido" shows `veiculo.nome`. These need to be swapped so the header labels match the correct data fields.

### Changes in `src/pages/logistica/FrotaMinimalista.tsx`

**Line 141**: Change `{veiculo.modelo}` → `{veiculo.nome}`
**Line 144**: Change `{veiculo.nome}` → `{veiculo.modelo}`

This way "Modelo" displays the vehicle's display name (`nome`) and "Apelido" displays the model (`modelo`), matching the memory note about the column restructuring.

### Files affected
- `src/pages/logistica/FrotaMinimalista.tsx` — swap two cell values

