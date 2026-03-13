

## Plano: Adicionar coluna "Mecânico" na Frota

### O que será feito

Adicionar um campo `mecanico` (text, nullable) na tabela `veiculos` e exibi-lo na listagem de frota.

### Mudanças

1. **Migration SQL**: Adicionar coluna `mecanico text null` na tabela `veiculos`.

2. **`src/hooks/useVeiculos.ts`**: Adicionar `mecanico: string | null` na interface `Veiculo` e `mecanico?: string` na `VeiculoFormData`.

3. **`src/components/frota/SortableVeiculoRow.tsx`**: Adicionar `<TableCell>` para `veiculo.mecanico` entre "Responsável" e "Km Atual".

4. **`src/pages/logistica/FrotaMinimalista.tsx`**: Adicionar `<TableHead>` "Mecânico" no header e ajustar colspan do empty state.

5. **`src/pages/logistica/FrotaNovoMinimalista.tsx`** e **`src/pages/logistica/FrotaEditMinimalista.tsx`**: Adicionar campo de input para "Mecânico" no formulário.

6. **`src/pages/Frota.tsx`** e **`src/pages/FrotaEdit.tsx`**: Adicionar coluna correspondente (versão não-minimalista).

