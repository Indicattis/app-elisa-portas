

## Plano: Observação obrigatória ao mudar status para "parado" ou "mecânico"

### O que será feito

Quando o usuário alterar o status de um veículo para "parado" ou "mecânico" na tela de edição (`FrotaEditMinimalista.tsx`), um modal de observação aparecerá automaticamente. Essa observação será salva como aviso (`aviso_justificativa` + `aviso_data`) no veículo e exibida na coluna de avisos na listagem `/logistica/frota`.

### Mudanças

**1. `src/pages/logistica/FrotaEditMinimalista.tsx`**
- Importar `AvisoVeiculoModal` e `Textarea`
- Adicionar estado para controlar o modal (`showAvisoModal`) e a observação (`observacao`)
- No `onValueChange` do Select de status: se o novo valor for "parado" ou "mecânico" (e o status anterior era "rodando"), abrir o modal de observação
- No `handleSave`: incluir `aviso_justificativa` e `aviso_data` nos dados enviados ao `updateVeiculo`
- Se o status voltar para "rodando", limpar o aviso automaticamente

**2. `src/hooks/useVeiculos.ts`**
- Adicionar `aviso_justificativa` e `aviso_data` ao tipo `VeiculoFormData` para que o `updateVeiculo` consiga enviar esses campos

**3. `src/components/frota/SortableVeiculoRow.tsx`**
- Adicionar coluna "Aviso" na row, exibindo um ícone de alerta amarelo com tooltip quando `veiculo.aviso_justificativa` existir

**4. `src/pages/logistica/FrotaMinimalista.tsx`**
- Adicionar `<TableHead>` "Aviso" no header da tabela e ajustar colspan do empty state

### Fluxo
1. Usuário muda status para "parado" ou "mecânico" → modal aparece pedindo observação
2. Ao confirmar, a observação é salva junto com a data atual nos campos `aviso_justificativa` e `aviso_data`
3. Na listagem, coluna "Aviso" mostra ícone amarelo com tooltip da justificativa
4. Ao voltar para "rodando", o aviso é limpo automaticamente

