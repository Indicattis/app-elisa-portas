

## Plan: Move buttons to header and add cancel vaga functionality

### 1. Move "Nova Função" and "Adicionar Vaga" buttons to the header

In `src/pages/direcao/GestaoColaboradoresDirecao.tsx`:

- Add a `headerActions` prop to `MinimalistLayout` with two buttons: "Nova Função" and "Nova Vaga"
- The "Nova Vaga" button opens a dialog where the user selects a role (from `systemRoles`) and provides a justification — reusing the existing vaga dialog but now with a role selector
- Remove the inline "Nova Função" button (lines 210-219) and the per-role "+ Vaga" card (lines 312-323)

### 2. Update the "Nova Vaga" dialog

- Add a `Select` for choosing the cargo/role (since it's no longer tied to a specific role card)
- Keep the existing justificativa textarea

### 3. Add "Cancelar Vaga" functionality

- Import `updateVagaStatus` from `useVagas` (already available in the hook)
- On each open vacancy placeholder card (the amber dashed cards, lines 299-311), add a cancel button (X icon) that appears on hover
- Clicking it calls `updateVagaStatus(vagaId, 'fechada')`
- To support this, change the vacancy rendering: instead of `Array.from({ length: group.openVagas })`, map the actual open vaga objects so we have access to their IDs
- Filter vagas by role to get the actual vaga records for each group

### Files changed
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — all changes in this single file

