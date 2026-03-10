

## Plan: Replace Responsável input with select box

### Change in `src/pages/logistica/FrotaEditMinimalista.tsx`

1. Import `useAllUsers` hook
2. Replace the `<Input>` on line 230 with a `<Select>` dropdown populated from `useAllUsers()`, using the same dark glassmorphism styling already used for the Status select
3. Each option shows the user's `nome`, and the value stored is the `nome` string (matching current `responsavel` field behavior)

### Files affected
- `src/pages/logistica/FrotaEditMinimalista.tsx` — import `useAllUsers`, swap Input for Select on the Responsável field

