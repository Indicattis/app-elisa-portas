

## Plan: Swap Apelido and Modelo fields in FrotaEditMinimalista

In `src/pages/logistica/FrotaEditMinimalista.tsx`, lines 214-225, swap the positions of:
- **Modelo** (currently 3rd field) → move to 1st position
- **Apelido** (currently 1st field) → move to 2nd position (where Placa is)
- **Placa** → move to 3rd position (where Modelo was)

Updated order: Modelo, Apelido, Placa, Ano.

### File: `src/pages/logistica/FrotaEditMinimalista.tsx`
- Line 214-221: Replace Apelido + Placa fields with Modelo + Apelido
- Line 222-225: Replace Modelo field with Placa field

Single file, 3 field positions swapped.

