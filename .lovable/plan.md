

## Plano: Adicionar coluna "Motorista" na listagem de frota

### Alterações

**1. Migration: adicionar coluna `motorista` na tabela `veiculos`**
- `ALTER TABLE veiculos ADD COLUMN motorista TEXT;`

**2. `src/hooks/useVeiculos.ts`**
- Adicionar `motorista` na interface `Veiculo` e `VeiculoFormData`

**3. `src/components/frota/SortableVeiculoRow.tsx`**
- Adicionar célula `{veiculo.motorista || "-"}` logo após a célula do Apelido (após `veiculo.modelo`, que é o campo exibido na coluna "Apelido")

**4. `src/pages/logistica/FrotaMinimalista.tsx`**
- Adicionar `<TableHead>Motorista</TableHead>` após o header "Apelido" (linha 53)
- Atualizar `colSpan` de 14 para 15

**5. `src/pages/logistica/FrotaNovoMinimalista.tsx`**
- Adicionar campo `motorista` no state do form
- Adicionar input de texto para "Motorista" no formulário

**6. `src/pages/logistica/FrotaEditMinimalista.tsx`**
- Adicionar `motorista` no state do form e no `useEffect` que carrega dados
- Adicionar input no formulário
- Incluir `motorista` no `handleSave`

**7. `src/components/frota/VeiculoForm.tsx`** (formulário legacy)
- Adicionar campo motorista para manter consistência

### Arquivos alterados
- Nova migration SQL
- `src/hooks/useVeiculos.ts`
- `src/components/frota/SortableVeiculoRow.tsx`
- `src/pages/logistica/FrotaMinimalista.tsx`
- `src/pages/logistica/FrotaNovoMinimalista.tsx`
- `src/pages/logistica/FrotaEditMinimalista.tsx`
- `src/components/frota/VeiculoForm.tsx`

